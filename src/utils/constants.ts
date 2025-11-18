/**
 * Constantes globales de la aplicación
 */

export const APP_NAME = 'CRUCE-HALCONES';
export const APP_VERSION = '1.0.0';

// Límites de archivos
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
export const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

// Rutas de archivos
export const DEFAULT_SHEET_NAME = 'Hoja1';

// Umbrales de validación
export const DISCREPANCY_THRESHOLD_PCT = 10; // Porcentaje de diferencia aceptable

// Mensajes del bot
export const MESSAGES = {
  WELCOME: `🦅 ¡Bienvenido a ${APP_NAME}!

Sistema automatizado de cruce de facturación.

Este bot te permite cruzar la información de facturación con la base operativa de manera rápida y precisa.`,

  HELP: `📚 *Ayuda - ${APP_NAME}*

*Comandos disponibles:*
• /start - Iniciar el bot
• /info - Información del sistema
• /cruce - Realizar cruce de facturación
• /reporte - Ver último reporte
• /help - Mostrar esta ayuda

*Cómo usar:*
1. Presiona "Realizar Cruce" o usa /cruce
2. Envía el archivo Excel de facturación
3. Espera el procesamiento
4. Descarga los resultados

*Formatos aceptados:* .xlsx
*Tamaño máximo:* 10MB`,

  INFO: `ℹ️ *Información del Sistema*

*Versión:* ${APP_VERSION}
*Sistema:* Cruce automático de facturación

*Proceso:*
1. Envías Excel 1 (FACTURACIÓN) - contiene datos a cruzar
2. Envías Excel 2 (BASE) - donde se cruzará la información
3. El bot cruza la info del Excel 1 → Excel 2
4. Recibes el Excel 2 actualizado + reporte

*Características:*
• Sin base de datos (procesamiento en tiempo real)
• Detección automática de duplicados
• Validación de montos
• Reportes detallados
• Cruce Excel 1 → Excel 2 (no viceversa)`,

  CRUCE_START: `📤 *PASO 1/2: Envía Excel de FACTURACIÓN*

Este archivo contiene los datos que se van a cruzar.

*Requisitos:*
• Formato: .xlsx
• Tamaño máximo: 10MB
• Debe contener: EXPEDIENTE, Folio 1, Factura 1, Monto 1`,

  PROCESSING: '⏳ Procesando archivo...\n\nEsto puede tomar unos segundos.',

  FILE_TOO_LARGE: '❌ El archivo es demasiado grande.\n\nTamaño máximo: 10MB',

  INVALID_FORMAT: '❌ Formato de archivo inválido.\n\nPor favor envía un archivo .xlsx',

  MISSING_COLUMNS: (columns: string[]) =>
    `❌ Faltan columnas requeridas:\n\n${columns.map((c) => `• ${c}`).join('\n')}`,

  ERROR: '❌ Ocurrió un error procesando el archivo.\n\nPor favor intenta nuevamente.',

  NO_REPORT: '📭 No hay reportes disponibles.\n\nRealiza un cruce primero usando /cruce',

  SUCCESS: '✅ Cruce completado exitosamente!',
};

// Emojis para el reporte
export const EMOJI = {
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '❌',
  INFO: 'ℹ️',
  STATS: '📊',
  MONEY: '💰',
  DOCUMENT: '📄',
  DOWNLOAD: '📥',
  DUPLICATE: '🔄',
  PENDING: '📋',
  PROCESSING: '⏳',
  ROCKET: '🚀',
  CHECK: '✓',
  CROSS: '✗',
};

// Nombres de archivos de salida
export const OUTPUT_FILES = {
  BASE_ACTUALIZADA: 'BASE_ACTUALIZADA.xlsx',
  REPORTE_TEXTO: 'REPORTE_CRUCE.txt',
};

// Botones del teclado
export const KEYBOARD_BUTTONS = {
  REALIZAR_CRUCE: '🚀 Realizar Cruce',
  VER_INFO: 'ℹ️ Información',
  VER_REPORTE: '📊 Ver Último Reporte',
  AYUDA: '❓ Ayuda',
  VOLVER_MENU: '🏠 Volver al Menú',
};
