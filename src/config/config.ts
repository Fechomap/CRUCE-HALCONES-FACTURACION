/**
 * Configuración centralizada de la aplicación
 */
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

// Validar variables requeridas
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Determinar el directorio raíz del proyecto
const getRootDir = (): string => {
  // Si estamos en desarrollo (src), subir dos niveles
  // Si estamos en producción (dist), subir dos niveles
  return path.resolve(__dirname, '../..');
};

const rootDir = getRootDir();

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
  },

  // Paths
  rootDir,
  tempDir: process.env.TEMP_DIR || path.join(rootDir, 'temp'),
  logsDir: process.env.LOGS_DIR || path.join(rootDir, 'logs'),

  // File validation
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024,
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || '.xlsx').split(','),

  // Excel configuration
  excelSheetName: process.env.EXCEL_SHEET_NAME || 'Hoja1',
  normalizeHeaders: process.env.NORMALIZE_HEADERS !== 'false', // Enabled by default
  maxRowsPerFile: parseInt(process.env.MAX_ROWS_PER_FILE || '10000', 10),
  warnRowsThreshold: parseInt(process.env.WARN_ROWS_THRESHOLD || '5000', 10),

  // App info
  appName: 'CRUCE-HALCONES',
  version: '1.0.0',
} as const;

// Validación adicional
if (!config.telegram.botToken || config.telegram.botToken === 'your_telegram_bot_token_here') {
  console.warn('⚠️  WARNING: TELEGRAM_BOT_TOKEN is not set or using default value');
  console.warn('⚠️  Please set your bot token in the .env file');
}

export default config;
