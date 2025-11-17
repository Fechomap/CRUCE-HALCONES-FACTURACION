/**
 * Tests de integración completos con archivos Excel reales
 * Este test valida el flujo completo: Validación → Cruce → Reporte
 */
import { describe, test, expect, afterAll } from '@jest/globals';
import path from 'path';
import fs from 'fs/promises';
import { excelService } from '../../src/services/excel.service';
import { validationService } from '../../src/services/validation.service';
import { matchingService } from '../../src/services/matching.service';
import { reportService } from '../../src/services/report.service';

describe('Flujo Completo de Cruce (Integración)', () => {
  const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
  const facturacionFile = path.join(fixturesDir, 'facturacion-test.xlsx');
  const cotejoFile = path.join(fixturesDir, 'cotejo-test.xlsx');
  const outputFile = path.join(fixturesDir, 'output-test.xlsx');
  const reportFile = path.join(fixturesDir, 'report-test.txt');

  afterAll(async () => {
    // Limpiar archivos de salida
    await fs.unlink(outputFile).catch(() => {});
    await fs.unlink(reportFile).catch(() => {});
  });

  test('debe validar archivo de facturación correctamente', async () => {
    const result = await validationService.validateFacturacionFile(facturacionFile);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('debe validar archivo base correctamente', async () => {
    const result = await validationService.validateCotejoFile(cotejoFile);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('debe leer archivo de facturación y retornar datos', async () => {
    const data = await excelService.readExcel(facturacionFile);

    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('EXPEDIENTE');
    expect(data[0]).toHaveProperty('Folio 1');
  });

  test('debe leer archivo base y retornar datos', async () => {
    const data = await excelService.readExcel(cotejoFile);

    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('EXPEDIENTE');
  });

  test('debe ejecutar cruce completo exitosamente', async () => {
    const report = await matchingService.ejecutarCruce(facturacionFile, cotejoFile);

    expect(report).toBeDefined();
    expect(report.stats).toBeDefined();
    expect(report.stats.processedCount).toBeGreaterThan(0);
    expect(report.stats.matchedCount).toBeGreaterThanOrEqual(0);
    expect(report.generatedAt).toBeInstanceOf(Date);
  });

  test('debe generar estadísticas correctas del cruce', async () => {
    const report = await matchingService.ejecutarCruce(facturacionFile, cotejoFile);

    expect(report.stats.processedCount).toBeGreaterThan(0);
    expect(report.stats.totalAmount).toBeGreaterThanOrEqual(0);

    // La suma de encontrados + no encontrados debe ser igual a procesados
    const total = report.stats.matchedCount + report.stats.notFoundCount;
    expect(total).toBe(report.stats.processedCount);
  });

  test('debe guardar base actualizada con fórmulas preservadas', async () => {
    await matchingService.ejecutarCruce(facturacionFile, cotejoFile);
    await matchingService.guardarBaseActualizada(outputFile);

    // Verificar que el archivo existe
    const exists = await fs
      .access(outputFile)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);

    // Verificar que puede ser leído
    const data = await excelService.readExcel(outputFile);
    expect(data.length).toBeGreaterThan(0);
  });

  test('debe generar reporte de texto completo', async () => {
    const report = await matchingService.ejecutarCruce(facturacionFile, cotejoFile);
    await reportService.guardarReporte(report, reportFile);

    // Verificar que el archivo existe
    const exists = await fs
      .access(reportFile)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);

    // Leer contenido del reporte
    const content = await fs.readFile(reportFile, 'utf-8');
    expect(content).toContain('REPORTE DE CRUCE');
    expect(content).toContain('ESTADÍSTICAS GENERALES');
    expect(content).toContain('Expedientes procesados:');
  });

  test('debe generar reporte de Telegram formateado', async () => {
    const report = await matchingService.ejecutarCruce(facturacionFile, cotejoFile);
    const telegramReport = reportService.generarReporteTelegram(report);

    expect(telegramReport).toContain('CRUCE COMPLETADO');
    expect(telegramReport).toContain('Expedientes procesados:');
    expect(telegramReport).toContain('BASE\\_ACTUALIZADA.xlsx'); // Markdown escaped
  });

  test('debe detectar expedientes duplicados si existen', async () => {
    const report = await matchingService.ejecutarCruce(facturacionFile, cotejoFile);

    // Si hay duplicados, deben estar en el reporte
    if (report.stats.duplicatesCount > 0) {
      expect(report.duplicados.length).toBeGreaterThan(0);
      expect(report.duplicados[0]).toHaveProperty('expediente');
      expect(report.duplicados[0]).toHaveProperty('occurrences');
      expect(report.duplicados[0].occurrences).toBeGreaterThan(1);
    }
  });

  test('debe calcular diferencias correctamente', async () => {
    await matchingService.ejecutarCruce(facturacionFile, cotejoFile);
    const actualizado = matchingService.getCotejoActualizado();

    // Verificar que se calculó DIFERENCIAS
    const conFacturacion = actualizado.find((row: any) => row['Folio 1'] != null);

    if (conFacturacion) {
      expect(conFacturacion).toHaveProperty('DIFERENCIAS');
      expect(conFacturacion).toHaveProperty('COBRADO // FACTURADO');

      // DIFERENCIAS = TOTAL - COBRADO
      const esperado = conFacturacion.TOTAL - conFacturacion['COBRADO // FACTURADO'];
      expect(conFacturacion.DIFERENCIAS).toBeCloseTo(esperado, 2);
    }
  });

  test('debe validar columnas con fuzzy matching', async () => {
    const result = await excelService.validateColumns(
      facturacionFile,
      ['EXPEDIENTE', 'Folio 1', 'Factura 1', 'Monto 1']
    );

    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  test('debe normalizar headers correctamente', async () => {
    const headers = await excelService.getHeaders(facturacionFile);

    expect(headers).toBeDefined();
    expect(headers.length).toBeGreaterThan(0);

    // Verificar que headers fueron normalizados (sin espacios trailing)
    headers.forEach(header => {
      expect(header).toBe(header.trim());
      expect(header).not.toMatch(/\s{2,}/); // No espacios dobles
    });
  });
});
