/**
 * Tests unitarios para sistema de errores
 */
import { describe, test, expect } from '@jest/globals';
import {
  ErrorCode,
  AppError,
  createFileTooLargeError,
  createInvalidFormatError,
  createMissingColumnsError,
  createEmptyFileError,
  isAppError,
  getUserMessage,
} from '../../src/utils/errors';

describe('AppError', () => {
  test('crea instancia correctamente', () => {
    const error = new AppError(
      ErrorCode.UNKNOWN_ERROR,
      'test message',
      'user message',
      { test: true }
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.message).toBe('test message');
    expect(error.userMessage).toBe('user message');
    expect(error.details).toEqual({ test: true });
  });
});

describe('createFileTooLargeError', () => {
  test('crea error de archivo demasiado grande', () => {
    const error = createFileTooLargeError(15 * 1024 * 1024, 10 * 1024 * 1024);

    expect(error.code).toBe(ErrorCode.FILE_TOO_LARGE);
    expect(error.userMessage).toContain('15.00 MB');
    expect(error.userMessage).toContain('10.00 MB');
  });
});

describe('createInvalidFormatError', () => {
  test('crea error de formato inválido', () => {
    const error = createInvalidFormatError('test.pdf', ['.xlsx']);

    expect(error.code).toBe(ErrorCode.FILE_INVALID_FORMAT);
    expect(error.userMessage).toContain('test.pdf');
    expect(error.userMessage).toContain('.xlsx');
  });
});

describe('createMissingColumnsError', () => {
  test('crea error de columnas faltantes', () => {
    const error = createMissingColumnsError(['EXPEDIENTE', 'Folio 1'], 'facturación');

    expect(error.code).toBe(ErrorCode.VALIDATION_MISSING_COLUMNS);
    expect(error.userMessage).toContain('EXPEDIENTE');
    expect(error.userMessage).toContain('Folio 1');
    expect(error.userMessage).toContain('facturación');
  });
});

describe('createEmptyFileError', () => {
  test('crea error de archivo vacío', () => {
    const error = createEmptyFileError('test.xlsx');

    expect(error.code).toBe(ErrorCode.VALIDATION_EMPTY_FILE);
    expect(error.userMessage).toContain('test.xlsx');
  });
});

describe('isAppError', () => {
  test('identifica AppError correctamente', () => {
    const appError = new AppError(ErrorCode.UNKNOWN_ERROR, 'test', 'test');
    const normalError = new Error('test');

    expect(isAppError(appError)).toBe(true);
    expect(isAppError(normalError)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe('getUserMessage', () => {
  test('extrae mensaje de usuario de AppError', () => {
    const error = new AppError(ErrorCode.UNKNOWN_ERROR, 'tech msg', 'user msg');
    expect(getUserMessage(error)).toBe('user msg');
  });

  test('maneja Error regular', () => {
    const error = new Error('test error');
    const message = getUserMessage(error);

    expect(message).toContain('Error inesperado');
    expect(message).toContain('test error');
  });

  test('maneja valores no-Error', () => {
    const message = getUserMessage('string error');

    expect(message).toContain('Error inesperado');
  });
});
