/**
 * Funciones auxiliares
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatea una fecha
 */
export function formatDate(date: Date, formatStr = 'dd/MM/yyyy HH:mm:ss'): string {
  return format(date, formatStr, { locale: es });
}

/**
 * Valida si un expediente es válido (9 dígitos)
 */
export function isValidExpediente(expediente: number): boolean {
  const expedienteStr = expediente.toString();
  return expedienteStr.length === 9 && !isNaN(expediente);
}

/**
 * Valida si un folio es válido (8 dígitos)
 */
export function isValidFolio(folio: number): boolean {
  const folioStr = folio.toString();
  return folioStr.length === 8 && !isNaN(folio);
}

/**
 * Trunca un string a una longitud máxima
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitiza un nombre de archivo
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Obtiene la extensión de un archivo
 */
export function getFileExtension(fileName: string): string {
  const match = fileName.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Convierte bytes a formato legible
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Genera un ID único basado en timestamp
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Espera un tiempo determinado (para delays)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifica si un valor es null o undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Verifica si un valor es un número válido
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Calcula el porcentaje de diferencia entre dos números
 */
export function calculatePercentageDiff(value1: number, value2: number): number {
  if (value2 === 0) return 0;
  return Math.abs(((value1 - value2) / value2) * 100);
}

/**
 * Escape de caracteres especiales para Markdown
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Crea un separador de línea
 */
export function separator(length = 80, char = '─'): string {
  return char.repeat(length);
}

/**
 * Crea un separador grueso
 */
export function thickSeparator(length = 80): string {
  return '═'.repeat(length);
}
