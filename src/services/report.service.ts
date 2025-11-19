/**
 * Servicio de generación de reportes
 */
import fs from 'fs/promises';
import { createLogger } from '../utils/logger';
import { formatCurrency, formatDate, separator, thickSeparator } from '../utils/helpers';
import { EMOJI } from '../utils/constants';
import type { MatchingReport } from '../types';

const logger = createLogger({ service: 'ReportService' });

export class ReportService {
  /**
   * Genera el reporte completo en formato texto
   */
  generarReporteTexto(report: MatchingReport): string {
    const lines: string[] = [];

    // Header
    lines.push(thickSeparator(80));
    lines.push('REPORTE DE CRUCE DE FACTURACIÓN - HALCONES');
    lines.push(`Fecha: ${formatDate(report.generatedAt)}`);
    lines.push(thickSeparator(80));

    // Estadísticas generales
    lines.push('');
    lines.push(`${EMOJI.STATS} ESTADÍSTICAS GENERALES`);
    lines.push(separator(80));
    lines.push(`Expedientes procesados:        ${report.stats.processedCount}`);
    lines.push(`Coincidencias encontradas:     ${report.stats.matchedCount}`);
    lines.push(`No encontrados en base:        ${report.stats.notFoundCount}`);
    lines.push(`Duplicados en base:            ${report.stats.duplicatesCount}`);
    lines.push(`Sin facturación:               ${report.stats.unfacturedCount}`);
    lines.push(`Discrepancias de monto:        ${report.stats.discrepanciesCount}`);
    lines.push('');
    lines.push(`Monto total facturado:         ${formatCurrency(report.stats.totalAmount)}`);

    // Expedientes no encontrados
    if (report.noEncontrados.length > 0) {
      lines.push('');
      lines.push('');
      lines.push(`${EMOJI.WARNING} EXPEDIENTES FACTURADOS NO ENCONTRADOS EN BASE OPERATIVA`);
      lines.push(separator(80));
      for (const item of report.noEncontrados) {
        lines.push(
          `EXPEDIENTE: ${item.expediente} | Folio: ${item.folio1} | ` +
            `Factura: ${item.factura1} | Monto: ${formatCurrency(item.monto1)}`
        );
      }
    }

    // Duplicados
    if (report.duplicados.length > 0) {
      lines.push('');
      lines.push('');
      lines.push(`${EMOJI.DUPLICATE} EXPEDIENTES DUPLICADOS EN BASE OPERATIVA`);
      lines.push(separator(80));
      for (const item of report.duplicados) {
        lines.push(
          `EXPEDIENTE: ${item.expediente} | ` +
            `Ocurrencias: ${item.occurrences} | ` +
            `Facturación aplicada a todas`
        );
      }
    }

    // Discrepancias
    if (report.discrepancias.length > 0) {
      lines.push('');
      lines.push('');
      lines.push(`${EMOJI.WARNING} DISCREPANCIAS DE MONTOS`);
      lines.push(separator(80));
      for (const item of report.discrepancias) {
        lines.push(`EXPEDIENTE: ${item.expediente}`);
        lines.push(`   Monto facturado:   ${formatCurrency(item.montoFacturado)}`);
        lines.push(`   Total servicio:    ${formatCurrency(item.totalServicio)}`);
        lines.push(
          `   Diferencia:        ${formatCurrency(item.diferencia)} ` +
            `(${item.diferenciaPct.toFixed(1)}%)`
        );
        lines.push('');
      }
    }

    // Sin facturación
    if (report.sinFacturar.length > 0) {
      lines.push('');
      lines.push('');
      lines.push(`${EMOJI.PENDING} SERVICIOS SIN FACTURACIÓN (PENDIENTES)`);
      lines.push(separator(80));
      let totalPendiente = 0;
      for (const item of report.sinFacturar) {
        lines.push(
          `EXPEDIENTE: ${item.expediente} | ` +
            `Total servicio: ${formatCurrency(item.totalServicio)} | ` +
            `Fecha: ${formatDate(item.fecha, 'dd/MM/yyyy')}`
        );
        totalPendiente += item.totalServicio;
      }
      lines.push('');
      lines.push(
        `Total pendientes: ${report.sinFacturar.length} expedientes | ` +
          `Monto: ${formatCurrency(totalPendiente)}`
      );
    }

    // Footer
    lines.push('');
    lines.push(thickSeparator(80));
    lines.push(`${EMOJI.SUCCESS} CRUCE COMPLETADO`);
    lines.push(thickSeparator(80));

    return lines.join('\n');
  }

  /**
   * Genera el reporte resumido para Telegram
   */
  generarReporteTelegram(report: MatchingReport): string {
    const lines: string[] = [];

    lines.push(`${EMOJI.SUCCESS} *CRUCE COMPLETADO*`);
    lines.push('');
    lines.push(`${EMOJI.STATS} *Resumen:*`);
    lines.push(`• Expedientes procesados: ${report.stats.processedCount}`);
    lines.push(`• Coincidencias: ${report.stats.matchedCount}`);

    if (report.stats.notFoundCount > 0) {
      lines.push(`• No encontrados: ${report.stats.notFoundCount} ${EMOJI.WARNING}`);
    }

    if (report.stats.duplicatesCount > 0) {
      lines.push(`• Duplicados: ${report.stats.duplicatesCount} ${EMOJI.DUPLICATE}`);
    }

    if (report.stats.unfacturedCount > 0) {
      lines.push(`• Sin facturar: ${report.stats.unfacturedCount} ${EMOJI.PENDING}`);
    }

    if (report.stats.discrepanciesCount > 0) {
      lines.push(`• Discrepancias: ${report.stats.discrepanciesCount} ${EMOJI.WARNING}`);
    }

    lines.push('');
    lines.push(`${EMOJI.MONEY} *Monto facturado:* ${formatCurrency(report.stats.totalAmount)}`);
    lines.push('');
    lines.push(`${EMOJI.DOWNLOAD} *Archivos generados:*`);
    lines.push(`1️⃣ BASE\\_ACTUALIZADA.xlsx`);
    lines.push(`2️⃣ REPORTE\\_CRUCE.txt`);

    return lines.join('\n');
  }

  /**
   * Guarda el reporte en un archivo
   */
  async guardarReporte(report: MatchingReport, outputPath: string): Promise<void> {
    try {
      logger.info('Saving report', { outputPath });
      const reportText = this.generarReporteTexto(report);
      await fs.writeFile(outputPath, reportText, 'utf-8');
      logger.info('Report saved successfully', { outputPath });
    } catch (error) {
      logger.error('Error saving report', error as Error);
      throw error;
    }
  }

  /**
   * Genera un resumen corto de estadísticas
   */
  generarResumen(report: MatchingReport): string {
    return (
      `Procesados: ${report.stats.processedCount} | ` +
      `Encontrados: ${report.stats.matchedCount} | ` +
      `Total: ${formatCurrency(report.stats.totalAmount)}`
    );
  }

  /**
   * Genera alertas si hay problemas
   */
  generarAlertas(report: MatchingReport): string[] {
    const alertas: string[] = [];

    if (report.stats.notFoundCount > 0) {
      alertas.push(
        `${EMOJI.WARNING} ${report.stats.notFoundCount} expedientes no encontrados en la base`
      );
    }

    if (report.stats.duplicatesCount > 0) {
      alertas.push(
        `${EMOJI.DUPLICATE} ${report.stats.duplicatesCount} expedientes duplicados detectados`
      );
    }

    if (report.stats.unfacturedCount > 0) {
      alertas.push(`${EMOJI.PENDING} ${report.stats.unfacturedCount} servicios sin facturación`);
    }

    const discrepanciasGraves = report.discrepancias.filter((d) => d.diferenciaPct > 50);
    if (discrepanciasGraves.length > 0) {
      alertas.push(`${EMOJI.ERROR} ${discrepanciasGraves.length} discrepancias mayores al 50%`);
    }

    return alertas;
  }
}

// Singleton
export const reportService = new ReportService();
