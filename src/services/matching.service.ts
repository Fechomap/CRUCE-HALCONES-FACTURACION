/**
 * Servicio de cruce de información (Matching)
 */
import { excelService } from './excel.service';
import { createLogger } from '../utils/logger';
import { isNullOrUndefined, calculatePercentageDiff } from '../utils/helpers';
import { DISCREPANCY_THRESHOLD_PCT } from '../utils/constants';
import type { FacturacionRow } from '../models/facturacion.model';
import type { CotejoRow } from '../models/cotejo.model';
import type {
  MatchingReport,
  MatchingStats,
  ExpedienteMatch,
  ExpedienteNotFound,
  ExpedienteDuplicate,
  ExpedienteUnfactured,
  MontoDiscrepancy,
} from '../types';

const logger = createLogger({ service: 'MatchingService' });

export class MatchingService {
  private facturacionData: FacturacionRow[] = [];
  private cotejoData: CotejoRow[] = [];
  private cotejoFilePath = ''; // Guardar path del archivo original

  /**
   * Ejecuta el proceso completo de cruce
   */
  async ejecutarCruce(
    facturacionFilePath: string,
    cotejoFilePath: string
  ): Promise<MatchingReport> {
    logger.info('Starting matching process', { facturacionFilePath, cotejoFilePath });

    // Guardar path del archivo cotejo original
    this.cotejoFilePath = cotejoFilePath;

    // Cargar archivos
    await this.cargarArchivos(facturacionFilePath, cotejoFilePath);

    // Realizar cruce
    const report = this.realizarCruce();

    logger.info('Matching process completed', {
      processedCount: report.stats.processedCount,
      matchedCount: report.stats.matchedCount,
    });

    return report;
  }

  /**
   * Carga los archivos en memoria
   */
  private async cargarArchivos(
    facturacionFilePath: string,
    cotejoFilePath: string
  ): Promise<void> {
    logger.info('Loading files');

    this.facturacionData = await excelService.readExcel<FacturacionRow>(facturacionFilePath);
    this.cotejoData = await excelService.readExcel<CotejoRow>(cotejoFilePath);

    logger.info('Files loaded successfully', {
      facturacionRows: this.facturacionData.length,
      cotejoRows: this.cotejoData.length,
    });
  }

  /**
   * Realiza el cruce de información (OPTIMIZADO con Map index)
   */
  private realizarCruce(): MatchingReport {
    const startTime = Date.now();

    const encontrados: ExpedienteMatch[] = [];
    const noEncontrados: ExpedienteNotFound[] = [];
    const duplicados: ExpedienteDuplicate[] = [];
    const discrepancias: MontoDiscrepancy[] = [];

    // OPTIMIZACIÓN: Crear índice Map para búsquedas O(1) en lugar de O(n)
    logger.info('Creating expediente index for O(1) lookups...');
    const expedienteIndex = new Map<number, number[]>();

    for (let i = 0; i < this.cotejoData.length; i++) {
      const expediente = this.cotejoData[i].EXPEDIENTE;

      if (!expedienteIndex.has(expediente)) {
        expedienteIndex.set(expediente, []);
      }
      expedienteIndex.get(expediente)!.push(i);
    }

    logger.info('Expediente index created', {
      uniqueExpedientes: expedienteIndex.size,
      totalCotejoRows: this.cotejoData.length,
      duplicatesDetected: this.cotejoData.length - expedienteIndex.size,
    });

    // Procesar cada expediente de facturación
    const totalToProcess = this.facturacionData.length;
    let processed = 0;

    for (const rowFact of this.facturacionData) {
      const expediente = rowFact.EXPEDIENTE;
      processed++;

      // Log progreso cada 100 registros
      if (processed % 100 === 0) {
        logger.debug('Processing progress', {
          processed,
          total: totalToProcess,
          percent: ((processed / totalToProcess) * 100).toFixed(1) + '%',
        });
      }

      // Búsqueda O(1) en Map index
      const matchIndices = expedienteIndex.get(expediente) || [];

      if (matchIndices.length === 0) {
        // No encontrado
        noEncontrados.push({
          expediente,
          folio1: rowFact['Folio 1'],
          factura1: rowFact['Factura 1'],
          monto1: rowFact['Monto 1'],
        });

        logger.debug('Expediente not found in base', { expediente });
      } else if (matchIndices.length > 1) {
        // Duplicados
        duplicados.push({
          expediente,
          occurrences: matchIndices.length,
          indices: matchIndices,
        });

        // Actualizar todos los registros duplicados
        this.actualizarRegistros(matchIndices, rowFact);

        // Verificar discrepancias
        const discrepancy = this.verificarDiscrepancia(matchIndices[0], rowFact);
        if (discrepancy) {
          discrepancias.push(discrepancy);
        }

        encontrados.push({
          expediente,
          found: true,
          duplicated: true,
          occurrences: matchIndices.length,
          indices: matchIndices,
        });

        logger.debug('Duplicate expediente found', { expediente, occurrences: matchIndices.length });
      } else {
        // Encontrado único
        const matchIndex = matchIndices[0];
        this.actualizarRegistros([matchIndex], rowFact);

        // Verificar discrepancias
        const discrepancy = this.verificarDiscrepancia(matchIndex, rowFact);
        if (discrepancy) {
          discrepancias.push(discrepancy);
        }

        encontrados.push({
          expediente,
          found: true,
          duplicated: false,
        });

        logger.debug('Expediente matched', { expediente });
      }
    }

    // Identificar expedientes sin facturación
    const sinFacturar = this.identificarSinFacturar();

    // Calcular estadísticas
    const stats = this.calcularEstadisticas(encontrados, noEncontrados, duplicados, sinFacturar, discrepancias);

    // Métricas de performance
    const endTime = Date.now();
    const duration = endTime - startTime;
    const rowsPerSecond = totalToProcess > 0 ? Math.round((totalToProcess / duration) * 1000) : 0;

    logger.info('Cruce completed with performance metrics', {
      duration: `${duration}ms`,
      rowsPerSecond,
      efficiency: 'O(n) with Map index',
    });

    return {
      stats,
      encontrados,
      noEncontrados,
      duplicados,
      sinFacturar,
      discrepancias,
      generatedAt: new Date(),
    };
  }

  /**
   * Actualiza los registros en la base con información de facturación
   */
  private actualizarRegistros(indices: number[], rowFact: FacturacionRow): void {
    for (const idx of indices) {
      const rowCotejo = this.cotejoData[idx];

      // Actualizar Folios, Facturas y Montos (1-5)
      for (let i = 1; i <= 5; i++) {
        const folioKey = `Folio ${i}` as keyof FacturacionRow;
        const facturaKey = `Factura ${i}` as keyof FacturacionRow;
        const montoKey = `Monto ${i}` as keyof FacturacionRow;

        const folioValue = rowFact[folioKey];
        const facturaValue = rowFact[facturaKey];
        const montoValue = rowFact[montoKey];

        if (!isNullOrUndefined(folioValue)) {
          (rowCotejo as any)[folioKey] = folioValue;
          (rowCotejo as any)[facturaKey] = facturaValue;
          (rowCotejo as any)[montoKey] = typeof montoValue === 'number' ? montoValue : 0;
        }
      }

      // Calcular monto total facturado
      const montoTotal = this.calcularMontoTotal(rowFact);

      // Actualizar campos calculados
      rowCotejo['COBRADO // FACTURADO'] = montoTotal;
      rowCotejo.DIFERENCIAS = rowCotejo.TOTAL - montoTotal;
    }
  }

  /**
   * Calcula el monto total de todas las facturas
   */
  private calcularMontoTotal(row: FacturacionRow): number {
    let total = 0;

    for (let i = 1; i <= 5; i++) {
      const montoKey = `Monto ${i}` as keyof FacturacionRow;
      const montoValue = row[montoKey];

      if (typeof montoValue === 'number' && !isNaN(montoValue)) {
        total += montoValue;
      }
    }

    return total;
  }

  /**
   * Verifica si hay discrepancia de monto
   */
  private verificarDiscrepancia(
    cotejoIndex: number,
    rowFact: FacturacionRow
  ): MontoDiscrepancy | null {
    const rowCotejo = this.cotejoData[cotejoIndex];
    const totalServicio = rowCotejo.TOTAL;
    const montoFacturado = this.calcularMontoTotal(rowFact);

    if (totalServicio === 0) return null;

    const diferenciaPct = calculatePercentageDiff(montoFacturado, totalServicio);

    if (diferenciaPct > DISCREPANCY_THRESHOLD_PCT) {
      return {
        expediente: rowFact.EXPEDIENTE,
        montoFacturado,
        totalServicio,
        diferencia: Math.abs(totalServicio - montoFacturado),
        diferenciaPct,
      };
    }

    return null;
  }

  /**
   * Identifica expedientes sin facturación
   */
  private identificarSinFacturar(): ExpedienteUnfactured[] {
    const sinFacturar: ExpedienteUnfactured[] = [];

    for (const row of this.cotejoData) {
      // Si no tiene Folio 1 o es 0, no está facturado
      if (isNullOrUndefined(row['Folio 1']) || row['Folio 1'] === 0) {
        sinFacturar.push({
          expediente: row.EXPEDIENTE,
          totalServicio: row.TOTAL,
          fecha: row.FECHA || new Date(),
        });
      }
    }

    return sinFacturar;
  }

  /**
   * Calcula estadísticas del cruce
   */
  private calcularEstadisticas(
    encontrados: ExpedienteMatch[],
    noEncontrados: ExpedienteNotFound[],
    duplicados: ExpedienteDuplicate[],
    sinFacturar: ExpedienteUnfactured[],
    discrepancias: MontoDiscrepancy[]
  ): MatchingStats {
    const totalAmount = encontrados.reduce((sum, match) => {
      const rowFact = this.facturacionData.find(r => r.EXPEDIENTE === match.expediente);
      return sum + (rowFact ? this.calcularMontoTotal(rowFact) : 0);
    }, 0);

    return {
      processedCount: this.facturacionData.length,
      matchedCount: encontrados.length,
      notFoundCount: noEncontrados.length,
      duplicatesCount: duplicados.length,
      unfacturedCount: sinFacturar.length,
      discrepanciesCount: discrepancias.length,
      totalAmount,
    };
  }

  /**
   * Obtiene los datos actualizados de cotejo
   */
  getCotejoActualizado(): CotejoRow[] {
    return this.cotejoData;
  }

  /**
   * Guarda la base actualizada (PRESERVANDO FÓRMULAS)
   */
  async guardarBaseActualizada(outputPath: string): Promise<void> {
    logger.info('Saving updated base (preserving formulas)', { outputPath });
    // Usar el nuevo método que preserva fórmulas
    await excelService.updateExcelPreservingFormulas(
      this.cotejoFilePath,
      this.cotejoData,
      outputPath
    );
  }
}

// Singleton
export const matchingService = new MatchingService();
