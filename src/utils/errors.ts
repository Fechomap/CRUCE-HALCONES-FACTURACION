/**
 * Sistema centralizado de manejo de errores
 */
import { EMOJI } from './constants';

export enum ErrorCode {
  // Errores de archivo
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_FORMAT = 'FILE_INVALID_FORMAT',
  FILE_DOWNLOAD_FAILED = 'FILE_DOWNLOAD_FAILED',
  FILE_READ_FAILED = 'FILE_READ_FAILED',
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',

  // Errores de validación
  VALIDATION_MISSING_COLUMNS = 'VALIDATION_MISSING_COLUMNS',
  VALIDATION_INVALID_DATA = 'VALIDATION_INVALID_DATA',
  VALIDATION_EMPTY_FILE = 'VALIDATION_EMPTY_FILE',
  VALIDATION_EXPEDIENTE_INVALID = 'VALIDATION_EXPEDIENTE_INVALID',
  VALIDATION_FOLIO_INVALID = 'VALIDATION_FOLIO_INVALID',

  // Errores de procesamiento
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  MATCHING_FAILED = 'MATCHING_FAILED',
  REPORT_GENERATION_FAILED = 'REPORT_GENERATION_FAILED',

  // Errores de estado
  STATE_NOT_FOUND = 'STATE_NOT_FOUND',
  STATE_INVALID = 'STATE_INVALID',
  MISSING_ARCHIVO1 = 'MISSING_ARCHIVO1',

  // Errores del bot
  BOT_INIT_FAILED = 'BOT_INIT_FAILED',
  TELEGRAM_API_ERROR = 'TELEGRAM_API_ERROR',

  // Errores generales
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public userMessage: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Crea un error de archivo demasiado grande
 */
export function createFileTooLargeError(size: number, maxSize: number): AppError {
  return new AppError(
    ErrorCode.FILE_TOO_LARGE,
    `File size ${size} exceeds maximum ${maxSize}`,
    `${EMOJI.ERROR} *Archivo demasiado grande*\n\n` +
    `El archivo que enviaste excede el tamaño máximo permitido.\n\n` +
    `• Tamaño del archivo: ${(size / 1024 / 1024).toFixed(2)} MB\n` +
    `• Tamaño máximo: ${(maxSize / 1024 / 1024).toFixed(2)} MB\n\n` +
    `Por favor comprime el archivo o envía uno más pequeño.`,
    { size, maxSize }
  );
}

/**
 * Crea un error de formato inválido
 */
export function createInvalidFormatError(fileName: string, allowedTypes: string[]): AppError {
  return new AppError(
    ErrorCode.FILE_INVALID_FORMAT,
    `Invalid file format: ${fileName}`,
    `${EMOJI.ERROR} *Formato de archivo inválido*\n\n` +
    `El archivo "${fileName}" no tiene un formato válido.\n\n` +
    `• Formatos permitidos: ${allowedTypes.join(', ')}\n\n` +
    `Por favor envía un archivo Excel válido (.xlsx).`,
    { fileName, allowedTypes }
  );
}

/**
 * Crea un error de descarga fallida
 */
export function createFileDownloadError(fileId: string, originalError: Error): AppError {
  return new AppError(
    ErrorCode.FILE_DOWNLOAD_FAILED,
    `Failed to download file: ${fileId}`,
    `${EMOJI.ERROR} *Error al descargar archivo*\n\n` +
    `No se pudo descargar el archivo de Telegram.\n\n` +
    `Error: ${originalError.message}\n\n` +
    `Por favor intenta enviar el archivo nuevamente.`,
    { fileId, originalError: originalError.message }
  );
}

/**
 * Crea un error de columnas faltantes
 */
export function createMissingColumnsError(missingColumns: string[], fileType: string): AppError {
  return new AppError(
    ErrorCode.VALIDATION_MISSING_COLUMNS,
    `Missing required columns: ${missingColumns.join(', ')}`,
    `${EMOJI.ERROR} *Columnas requeridas faltantes*\n\n` +
    `El archivo ${fileType} no contiene todas las columnas requeridas.\n\n` +
    `*Columnas faltantes:*\n${missingColumns.map(c => `• ${c}`).join('\n')}\n\n` +
    `Por favor verifica que el archivo tenga la estructura correcta.`,
    { missingColumns, fileType }
  );
}

/**
 * Crea un error de archivo vacío
 */
export function createEmptyFileError(fileName: string): AppError {
  return new AppError(
    ErrorCode.VALIDATION_EMPTY_FILE,
    `File is empty: ${fileName}`,
    `${EMOJI.ERROR} *Archivo vacío*\n\n` +
    `El archivo "${fileName}" no contiene datos.\n\n` +
    `Por favor verifica que el archivo tenga información antes de enviarlo.`,
    { fileName }
  );
}

/**
 * Crea un error de datos inválidos
 */
export function createInvalidDataError(errors: string[]): AppError {
  const errorList = errors.slice(0, 5); // Mostrar solo primeros 5 errores
  const hasMore = errors.length > 5;

  return new AppError(
    ErrorCode.VALIDATION_INVALID_DATA,
    `Invalid data in file: ${errors.length} errors`,
    `${EMOJI.ERROR} *Datos inválidos en el archivo*\n\n` +
    `Se encontraron ${errors.length} errores en el archivo:\n\n` +
    `${errorList.map(e => `• ${e}`).join('\n')}` +
    `${hasMore ? `\n\n...y ${errors.length - 5} errores más.` : ''}\n\n` +
    `Por favor corrige estos errores y vuelve a enviar el archivo.`,
    { errors }
  );
}

/**
 * Crea un error de procesamiento fallido
 */
export function createProcessingError(stage: string, originalError: Error): AppError {
  return new AppError(
    ErrorCode.PROCESSING_FAILED,
    `Processing failed at stage: ${stage}`,
    `${EMOJI.ERROR} *Error al procesar*\n\n` +
    `Ocurrió un error durante el procesamiento en la etapa: ${stage}\n\n` +
    `*Error técnico:*\n\`${originalError.message}\`\n\n` +
    `Por favor intenta nuevamente. Si el error persiste, contacta al soporte.`,
    { stage, originalError: originalError.message, stack: originalError.stack }
  );
}

/**
 * Crea un error de estado no encontrado
 */
export function createStateNotFoundError(userId: number): AppError {
  return new AppError(
    ErrorCode.STATE_NOT_FOUND,
    `User state not found: ${userId}`,
    `${EMOJI.WARNING} *Sesión no encontrada*\n\n` +
    `No se encontró una sesión activa de cruce.\n\n` +
    `Por favor inicia un nuevo cruce usando el botón "🚀 Realizar Cruce" o el comando /cruce.`,
    { userId }
  );
}

/**
 * Crea un error de archivo 1 faltante
 */
export function createMissingArchivo1Error(): AppError {
  return new AppError(
    ErrorCode.MISSING_ARCHIVO1,
    'First file (facturación) is missing',
    `${EMOJI.ERROR} *Error: Archivo de facturación no encontrado*\n\n` +
    `No se encontró el archivo de facturación (Excel 1).\n\n` +
    `Por favor inicia el proceso nuevamente con /cruce y envía ambos archivos en orden:\n` +
    `1. Excel de facturación\n` +
    `2. Excel base`,
    {}
  );
}

/**
 * Crea un error de cruce fallido
 */
export function createMatchingError(originalError: Error, context?: unknown): AppError {
  return new AppError(
    ErrorCode.MATCHING_FAILED,
    'Matching process failed',
    `${EMOJI.ERROR} *Error en el cruce de información*\n\n` +
    `Ocurrió un error al cruzar los datos entre los archivos.\n\n` +
    `*Error técnico:*\n\`${originalError.message}\`\n\n` +
    `Posibles causas:\n` +
    `• Estructura de archivos incompatible\n` +
    `• Datos corruptos\n` +
    `• Expedientes con formato inválido\n\n` +
    `Por favor verifica los archivos y vuelve a intentar.`,
    { originalError: originalError.message, stack: originalError.stack, context }
  );
}

/**
 * Crea un error de generación de reporte fallida
 */
export function createReportGenerationError(originalError: Error): AppError {
  return new AppError(
    ErrorCode.REPORT_GENERATION_FAILED,
    'Report generation failed',
    `${EMOJI.ERROR} *Error al generar reporte*\n\n` +
    `El cruce se completó pero ocurrió un error al generar los reportes.\n\n` +
    `*Error técnico:*\n\`${originalError.message}\`\n\n` +
    `Los datos fueron procesados correctamente. Contacta al soporte para obtener los resultados.`,
    { originalError: originalError.message }
  );
}

/**
 * Crea un error desconocido
 */
export function createUnknownError(originalError: Error, context?: unknown): AppError {
  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    `Unknown error: ${originalError.message}`,
    `${EMOJI.ERROR} *Error inesperado*\n\n` +
    `Ocurrió un error inesperado en el sistema.\n\n` +
    `*ID del error:* \`${Date.now()}\`\n` +
    `*Error técnico:* \`${originalError.message}\`\n\n` +
    `Por favor intenta nuevamente. Si el error persiste, contacta al soporte con el ID del error.`,
    {
      originalError: originalError.message,
      stack: originalError.stack,
      context,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Determina si un error es de tipo AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Extrae el mensaje de usuario de un error
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    return createUnknownError(error).userMessage;
  }

  return createUnknownError(new Error(String(error))).userMessage;
}

/**
 * Log de error con contexto completo
 */
export function logError(error: unknown, logger: { error: (msg: string, err: Error, ctx?: unknown) => void }, context?: unknown): void {
  if (isAppError(error)) {
    logger.error(error.message, error, { code: error.code, details: error.details, context });
  } else if (error instanceof Error) {
    logger.error('Unexpected error', error, context);
  } else {
    logger.error('Unknown error type', new Error(String(error)), context);
  }
}
