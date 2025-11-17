/**
 * Tests unitarios para ReportService
 * Cobertura objetivo: 80%+
 */
import { describe, test, expect } from '@jest/globals';
import { ReportService } from '../../src/services/report.service';
import type { MatchingReport } from '../../src/types';

describe('ReportService', () => {
  const reportService = new ReportService();

  const mockReport: MatchingReport = {
    stats: {
      processedCount: 10,
      matchedCount: 8,
      notFoundCount: 2,
      duplicatesCount: 1,
      unfacturedCount: 3,
      discrepanciesCount: 5,
      totalAmount: 10000,
    },
    encontrados: [
      { expediente: 125286115, found: true, duplicated: false },
    ],
    noEncontrados: [
      { expediente: 999999999, folio1: 20380889, factura1: 'TGH5313', monto1: 325 },
    ],
    duplicados: [
      { expediente: 125286116, occurrences: 2, indices: [0, 1] },
    ],
    sinFacturar: [
      { expediente: 125286117, totalServicio: 500, fecha: new Date('2025-10-01') },
    ],
    discrepancias: [
      {
        expediente: 125286118,
        montoFacturado: 100,
        totalServicio: 1000,
        diferencia: 900,
        diferenciaPct: 90,
      },
    ],
    generatedAt: new Date('2025-11-17'),
  };

  describe('generarReporteTexto', () => {
    test('debe generar reporte con todas las secciones', () => {
      const report = reportService.generarReporteTexto(mockReport);

      expect(report).toContain('REPORTE DE CRUCE');
      expect(report).toContain('ESTADÍSTICAS GENERALES');
      expect(report).toContain('Expedientes procesados:        10');
      expect(report).toContain('Coincidencias encontradas:     8');
      expect(report).toContain('EXPEDIENTES FACTURADOS NO ENCONTRADOS');
      expect(report).toContain('EXPEDIENTES DUPLICADOS');
      expect(report).toContain('DISCREPANCIAS DE MONTOS');
      expect(report).toContain('SERVICIOS SIN FACTURACIÓN');
    });

    test('debe incluir monto total formateado', () => {
      const report = reportService.generarReporteTexto(mockReport);
      expect(report).toContain('$10,000.00');
    });

    test('debe mostrar no encontrados con detalles', () => {
      const report = reportService.generarReporteTexto(mockReport);
      expect(report).toContain('999999999');
      expect(report).toContain('20380889');
      expect(report).toContain('TGH5313');
    });
  });

  describe('generarReporteTelegram', () => {
    test('debe generar reporte resumido para Telegram', () => {
      const report = reportService.generarReporteTelegram(mockReport);

      expect(report).toContain('CRUCE COMPLETADO');
      expect(report).toContain('Expedientes procesados: 10');
      expect(report).toContain('Coincidencias: 8');
      expect(report).toContain('$10,000.00');
      expect(report).toContain('BASE\\_ACTUALIZADA.xlsx'); // Markdown escaped
    });

    test('debe incluir alertas si hay problemas', () => {
      const report = reportService.generarReporteTelegram(mockReport);
      expect(report).toContain('No encontrados: 2');
      expect(report).toContain('Duplicados: 1');
    });
  });

  describe('generarResumen', () => {
    test('debe generar resumen corto', () => {
      const resumen = reportService.generarResumen(mockReport);

      expect(resumen).toContain('10');
      expect(resumen).toContain('8');
      expect(resumen).toContain('$10,000.00');
    });
  });

  describe('generarAlertas', () => {
    test('debe generar alertas para problemas encontrados', () => {
      const alertas = reportService.generarAlertas(mockReport);

      expect(alertas.length).toBeGreaterThan(0);
      expect(alertas.some((a) => a.includes('no encontrados'))).toBe(true);
      expect(alertas.some((a) => a.includes('duplicados'))).toBe(true);
      expect(alertas.some((a) => a.includes('sin facturación'))).toBe(true);
    });

    test('debe incluir alerta de discrepancias graves', () => {
      const reportConDiscrepanciaGrave: MatchingReport = {
        ...mockReport,
        discrepancias: [
          {
            expediente: 125286118,
            montoFacturado: 100,
            totalServicio: 1000,
            diferencia: 900,
            diferenciaPct: 90, // >50%
          },
        ],
      };

      const alertas = reportService.generarAlertas(reportConDiscrepanciaGrave);

      expect(alertas.some((a) => a.includes('50%'))).toBe(true);
    });

    test('debe retornar array vacío si no hay problemas', () => {
      const reportSinProblemas: MatchingReport = {
        stats: {
          processedCount: 10,
          matchedCount: 10,
          notFoundCount: 0,
          duplicatesCount: 0,
          unfacturedCount: 0,
          discrepanciesCount: 0,
          totalAmount: 10000,
        },
        encontrados: [],
        noEncontrados: [],
        duplicados: [],
        sinFacturar: [],
        discrepancias: [],
        generatedAt: new Date(),
      };

      const alertas = reportService.generarAlertas(reportSinProblemas);
      expect(alertas).toHaveLength(0);
    });
  });
});
