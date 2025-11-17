/**
 * Sistema de logging con Winston
 */
import winston from 'winston';
import path from 'path';
import { config } from '../config/config';
import type { LogContext } from '../types';

// Formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, context, stack }) => {
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.toUpperCase()}]${contextStr}: ${message}${stackStr}`;
  })
);

// Crear logger
const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: customFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    // File transport - errores
    new winston.transports.File({
      filename: path.join(config.logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport - todo
    new winston.transports.File({
      filename: path.join(config.logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Wrapper class para agregar contexto
class Logger {
  private context?: LogContext;

  constructor(context?: LogContext) {
    this.context = context;
  }

  private log(level: string, message: string, context?: LogContext) {
    const mergedContext = { ...this.context, ...context };
    logger.log(level, message, { context: mergedContext });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, { ...context, error: error?.message, stack: error?.stack });
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  // Métodos específicos del dominio
  logUserAction(userId: number, action: string, details?: unknown): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      details,
    });
  }

  logFileProcessing(fileName: string, fileSize: number, userId: number): void {
    this.info(`File processing started`, {
      fileName,
      fileSize,
      userId,
    });
  }

  logMatchingResult(expediente: number, found: boolean, userId: number): void {
    this.debug(`Matching result for expediente ${expediente}`, {
      expediente,
      found,
      userId,
    });
  }

  logError(error: Error, context?: LogContext): void {
    this.error('Error occurred', error, context);
  }
}

// Factory para crear loggers con contexto
export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

// Logger por defecto
export const defaultLogger = new Logger();

export default logger;
