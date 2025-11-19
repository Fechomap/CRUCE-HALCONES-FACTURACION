/**
 * Servicio de validación (VERSIÓN MEJORADA)
 * - Fuzzy matching de columnas (case-insensitive)
 * - Filtrado de filas vacías
 * - Límites de procesamiento
 * - Mensajes de error descriptivos
 */
import { ZodError } from 'zod';
import { FacturacionRowSchema, FACTURACION_REQUIRED_COLUMNS } from '../models/facturacion.model';
import { COTEJO_REQUIRED_COLUMNS } from '../models/cotejo.model';
import { excelService } from './excel.service';
import { createLogger } from '../utils/logger';
import { isValidExpediente, isValidFolio } from '../utils/helpers';
import { config } from '../config/config';
import type { FacturacionRow } from '../models/facturacion.model';

const logger = createLogger({ service: 'ValidationService' });

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export class ValidationService {
  /**
   * Verifica si una fila está completamente vacía
   */
  private isEmptyRow(row: Record<string, unknown>): boolean {
    // Una fila es vacía si no tiene EXPEDIENTE válido
    const expediente = row.EXPEDIENTE;
    return (
      expediente == null ||
      expediente === '' ||
      expediente === 0 ||
      (typeof expediente === 'string' && expediente.trim() === '')
    );
  }

  /**
   * Valida el archivo de facturación completo
   */
  async validateFacturacionFile(filePath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      logger.info('Validating facturación file', { filePath });

      // 1. Validar columnas requeridas (fuzzy matching)
      const columnValidation = await excelService.validateColumns(
        filePath,
        FACTURACION_REQUIRED_COLUMNS
      );

      if (!columnValidation.valid) {
        const headers = await excelService.getHeaders(filePath);
        const availableHeaders = headers.slice(0, 10).join(', ');
        errors.push(
          `Faltan columnas requeridas: ${columnValidation.missing.join(', ')}\n` +
            `Columnas disponibles: ${availableHeaders}${headers.length > 10 ? '...' : ''}`
        );
        return { valid: false, errors, warnings };
      }

      // Reportar si hay columnas con nombres diferentes pero aceptadas
      if (columnValidation.suggestions.size > 0) {
        const suggestionsList: string[] = [];
        columnValidation.suggestions.forEach((actual, expected) => {
          suggestionsList.push(`"${expected}" → encontrada como "${actual}"`);
        });
        warnings.push(
          `Columnas encontradas con nombres ligeramente diferentes:\n${suggestionsList.join('\n')}\n(Aceptadas por normalización)`
        );
      }

      // 2. Leer datos
      const allRows = await excelService.readExcel<FacturacionRow>(filePath);

      // 3. Filtrar filas vacías
      const rows = allRows.filter((row) => !this.isEmptyRow(row));

      const emptyRowCount = allRows.length - rows.length;
      if (emptyRowCount > 0) {
        warnings.push(`Se ignoraron ${emptyRowCount} filas vacías`);
        logger.info('Empty rows filtered', {
          total: allRows.length,
          valid: rows.length,
          empty: emptyRowCount,
        });
      }

      if (rows.length === 0) {
        errors.push('El archivo no contiene datos válidos (todas las filas están vacías)');
        return { valid: false, errors, warnings };
      }

      // 4. Validar límite de filas
      if (rows.length > config.maxRowsPerFile) {
        errors.push(
          `Archivo demasiado grande: ${rows.length} filas.\n` +
            `Máximo permitido: ${config.maxRowsPerFile} filas`
        );
        return { valid: false, errors, warnings };
      }

      if (rows.length > config.warnRowsThreshold) {
        warnings.push(
          `Archivo grande (${rows.length} filas). ` +
            `El procesamiento puede tardar varios segundos.`
        );
      }

      // 5. Validar cada fila con Zod
      let validRows = 0;
      let invalidRows = 0;
      const maxErrorsToShow = 10;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          FacturacionRowSchema.parse(row);

          // Validaciones adicionales de negocio
          if (!isValidExpediente(row.EXPEDIENTE)) {
            if (errors.length < maxErrorsToShow) {
              errors.push(
                `Fila ${i + 2}: EXPEDIENTE inválido "${row.EXPEDIENTE}" (debe ser 9 dígitos)`
              );
            }
            invalidRows++;
            continue;
          }

          if (!isValidFolio(row['Folio 1'])) {
            if (errors.length < maxErrorsToShow) {
              errors.push(
                `Fila ${i + 2}: Folio 1 inválido "${row['Folio 1']}" (debe ser 8 dígitos)`
              );
            }
            invalidRows++;
            continue;
          }

          validRows++;
        } catch (error) {
          if (error instanceof ZodError && errors.length < maxErrorsToShow) {
            const fieldErrors = error.issues.map((issue) => {
              const field = String(issue.path.join('.'));
              const value = row[field as keyof FacturacionRow];
              return `${field}: ${issue.message}, recibió "${value}" (tipo: ${typeof value})`;
            });
            errors.push(`Fila ${i + 2}: ${fieldErrors.join('; ')}`);
          }
          invalidRows++;
        }
      }

      // Agregar nota si hay más errores
      if (errors.length >= maxErrorsToShow && invalidRows > maxErrorsToShow) {
        errors.push(
          `\n... y ${invalidRows - errors.length} errores más (total: ${invalidRows} filas inválidas)`
        );
      }

      logger.info('Validation completed', {
        validRows,
        invalidRows,
        totalRows: rows.length,
        emptyRows: emptyRowCount,
      });

      // Cambiar umbral: Si más del 20% son inválidas, rechazar
      const invalidPercent = rows.length > 0 ? (invalidRows / rows.length) * 100 : 0;

      if (invalidPercent > 20) {
        errors.push(
          `\nDemasiadas filas inválidas: ${invalidRows}/${rows.length} (${invalidPercent.toFixed(
            1
          )}%).\nMáximo permitido: 20%`
        );
        return { valid: false, errors, warnings };
      }

      // Si hay entre 10-20% inválidas, aceptar pero advertir
      if (invalidPercent > 10) {
        warnings.push(
          `${invalidRows} filas tienen errores (${invalidPercent.toFixed(
            1
          )}%). Estas filas serán ignoradas.`
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error('Error validating facturación file', error as Error);
      errors.push(`Error al validar archivo: ${(error as Error).message}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Valida el archivo base de cotejo
   */
  async validateCotejoFile(filePath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      logger.info('Validating cotejo file', { filePath });

      // Validar columnas requeridas (fuzzy matching)
      const columnValidation = await excelService.validateColumns(
        filePath,
        COTEJO_REQUIRED_COLUMNS
      );

      if (!columnValidation.valid) {
        const headers = await excelService.getHeaders(filePath);
        const availableHeaders = headers.slice(0, 10).join(', ');
        errors.push(
          `Faltan columnas requeridas en base: ${columnValidation.missing.join(', ')}\n` +
            `Columnas disponibles: ${availableHeaders}${headers.length > 10 ? '...' : ''}`
        );
        return { valid: false, errors, warnings };
      }

      // Reportar sugerencias si hay
      if (columnValidation.suggestions.size > 0) {
        const suggestionsList: string[] = [];
        columnValidation.suggestions.forEach((actual, expected) => {
          suggestionsList.push(`"${expected}" → "${actual}"`);
        });
        warnings.push(`Columnas normalizadas: ${suggestionsList.join(', ')}`);
      }

      // Validar que tenga datos
      const allRows = await excelService.readExcel(filePath);

      // Filtrar filas vacías
      const rows = allRows.filter((row) => !this.isEmptyRow(row as Record<string, unknown>));

      const emptyRowCount = allRows.length - rows.length;
      if (emptyRowCount > 0) {
        warnings.push(`Se ignoraron ${emptyRowCount} filas vacías en base`);
      }

      if (rows.length === 0) {
        errors.push('El archivo base no contiene datos válidos');
        return { valid: false, errors, warnings };
      }

      // Validar límite de filas
      if (rows.length > config.maxRowsPerFile) {
        errors.push(
          `Archivo base demasiado grande: ${rows.length} filas.\n` +
            `Máximo: ${config.maxRowsPerFile} filas`
        );
        return { valid: false, errors, warnings };
      }

      logger.info('Cotejo file validation completed', {
        rowCount: rows.length,
        emptyRows: emptyRowCount,
      });

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error('Error validating cotejo file', error as Error);
      errors.push(`Error al validar base: ${(error as Error).message}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Valida el tamaño de un archivo
   */
  validateFileSize(fileSize: number, maxSize: number): ValidationResult {
    if (fileSize > maxSize) {
      return {
        valid: false,
        errors: [
          `El archivo es demasiado grande (${(fileSize / 1024 / 1024).toFixed(2)} MB). ` +
            `Máximo: ${(maxSize / 1024 / 1024).toFixed(2)} MB`,
        ],
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Valida la extensión del archivo
   */
  validateFileExtension(fileName: string, allowedExtensions: string[]): ValidationResult {
    const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];

    if (!ext || !allowedExtensions.includes(ext)) {
      return {
        valid: false,
        errors: [`Extensión de archivo no válida. Permitidas: ${allowedExtensions.join(', ')}`],
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Valida el tipo MIME
   */
  validateMimeType(mimeType: string, allowedTypes: string[]): ValidationResult {
    if (!allowedTypes.includes(mimeType)) {
      return {
        valid: false,
        errors: [`Tipo de archivo no válido. Tipo recibido: ${mimeType}`],
      };
    }

    return { valid: true, errors: [] };
  }
}

// Singleton
export const validationService = new ValidationService();
