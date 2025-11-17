/**
 * Tests unitarios para funciones auxiliares
 */
import { describe, test, expect } from '@jest/globals';
import {
  formatCurrency,
  formatNumber,
  isValidExpediente,
  isValidFolio,
  calculatePercentageDiff,
  sanitizeFileName,
  getFileExtension,
} from '../../src/utils/helpers';

describe('formatCurrency', () => {
  test('formatea números como moneda mexicana', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatNumber', () => {
  test('formatea números con separadores de miles', () => {
    expect(formatNumber(1000)).toBe('1,000.00');
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
    expect(formatNumber(100, 0)).toBe('100');
  });
});

describe('isValidExpediente', () => {
  test('valida expedientes de 9 dígitos', () => {
    expect(isValidExpediente(125286115)).toBe(true);
    expect(isValidExpediente(123456789)).toBe(true);
  });

  test('rechaza expedientes inválidos', () => {
    expect(isValidExpediente(1234)).toBe(false);
    expect(isValidExpediente(1234567890)).toBe(false);
    expect(isValidExpediente(NaN)).toBe(false);
  });
});

describe('isValidFolio', () => {
  test('valida folios de 8 dígitos', () => {
    expect(isValidFolio(20380889)).toBe(true);
    expect(isValidFolio(12345678)).toBe(true);
  });

  test('rechaza folios inválidos', () => {
    expect(isValidFolio(123)).toBe(false);
    expect(isValidFolio(123456789)).toBe(false);
    expect(isValidFolio(NaN)).toBe(false);
  });
});

describe('calculatePercentageDiff', () => {
  test('calcula porcentaje de diferencia correctamente', () => {
    expect(calculatePercentageDiff(100, 200)).toBe(50);
    expect(calculatePercentageDiff(200, 100)).toBe(100);
    expect(calculatePercentageDiff(100, 100)).toBe(0);
  });

  test('maneja división por cero', () => {
    expect(calculatePercentageDiff(100, 0)).toBe(0);
  });
});

describe('sanitizeFileName', () => {
  test('sanitiza nombres de archivo', () => {
    expect(sanitizeFileName('archivo test.xlsx')).toBe('archivo_test.xlsx');
    const result = sanitizeFileName('archivo/con\\caracteres:test.xlsx');
    expect(result).toContain('archivo_con');
    expect(result).toContain('.xlsx');
  });
});

describe('getFileExtension', () => {
  test('obtiene extensión de archivo', () => {
    expect(getFileExtension('archivo.xlsx')).toBe('.xlsx');
    expect(getFileExtension('archivo.test.xlsx')).toBe('.xlsx');
    expect(getFileExtension('archivo')).toBe('');
  });

  test('convierte a minúsculas', () => {
    expect(getFileExtension('archivo.XLSX')).toBe('.xlsx');
  });
});
