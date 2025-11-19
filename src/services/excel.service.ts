/**
 * Servicio para manejo de archivos Excel
 * VERSIÓN MEJORADA: Preserva fórmulas, formatos y estructura original
 */
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import { createLogger } from '../utils/logger';
import { config } from '../config/config';

const logger = createLogger({ service: 'ExcelService' });

export class ExcelService {
  /**
   * Convierte número de columna a letra (1='A', 27='AA', 77='BY')
   */
  private numberToColumn(num: number): string {
    let result = '';
    let n = num;
    while (n > 0) {
      const remainder = (n - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      n = Math.floor((n - 1) / 26);
    }
    return result;
  }

  /**
   * Normaliza un header (elimina espacios, caracteres especiales)
   */
  private normalizeHeader(header: string): string {
    return header
      .trim() // Eliminar espacios al inicio y final
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples a uno solo
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Eliminar caracteres invisibles
  }

  /**
   * Normaliza header para comparación (case-insensitive)
   */
  private normalizeHeaderForComparison(header: string): string {
    return this.normalizeHeader(header).toLowerCase();
  }

  /**
   * Lee un archivo Excel y retorna las filas como objetos
   */
  async readExcel<T = unknown>(filePath: string, sheetName?: string): Promise<T[]> {
    try {
      logger.info(`Reading Excel file: ${filePath}`);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      // Usar nombre de hoja de config si no se proporciona
      const actualSheetName = sheetName || config.excelSheetName;

      const worksheet = workbook.getWorksheet(actualSheetName);
      if (!worksheet) {
        throw new Error(`Sheet "${actualSheetName}" not found in workbook`);
      }

      const rows: T[] = [];
      const headers: string[] = [];

      // Obtener headers de la primera fila
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        const cellValue = cell.value;
        const rawHeader =
          typeof cellValue === 'string' || typeof cellValue === 'number'
            ? String(cellValue)
            : `Column${colNumber}`;
        // Normalizar header
        headers[colNumber - 1] = this.normalizeHeader(rawHeader);
      });

      // Leer todas las filas de datos
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData: Record<string, unknown> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = this.parseCellValue(cell.value);
          }
        });

        rows.push(rowData as T);
      });

      logger.info(`Successfully read ${rows.length} rows from Excel`, { rowCount: rows.length });
      return rows;
    } catch (error) {
      logger.error(`Error reading Excel file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * NUEVO: Actualiza un archivo Excel preservando fórmulas y formatos
   * Este método lee el Excel original, actualiza solo las celdas modificadas,
   * y preserva todo lo demás (fórmulas, estilos, validaciones, etc.)
   */
  async updateExcelPreservingFormulas<T extends Record<string, unknown>>(
    originalFilePath: string,
    data: T[],
    outputPath: string,
    sheetName?: string
  ): Promise<void> {
    try {
      logger.info(`Updating Excel file (preserving formulas): ${originalFilePath}`);

      // 1. Leer el workbook original completo
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(originalFilePath);

      const actualSheetName = sheetName || config.excelSheetName;
      const worksheet = workbook.getWorksheet(actualSheetName);

      if (!worksheet) {
        throw new Error(`Sheet "${actualSheetName}" not found`);
      }

      // 2. Obtener headers (fila 1)
      const headers: string[] = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        const cellValue = cell.value;
        const headerStr =
          typeof cellValue === 'string' || typeof cellValue === 'number' ? String(cellValue) : '';
        headers[colNumber - 1] = this.normalizeHeader(headerStr);
      });

      // 3. Crear map de columnas: header → columnIndex
      const columnMap = new Map<string, number>();
      headers.forEach((header, index) => {
        columnMap.set(header, index + 1); // Excel columns are 1-indexed
      });

      // 4. Actualizar cada fila de datos (solo valores, preservando fórmulas)
      for (let dataRowIndex = 0; dataRowIndex < data.length; dataRowIndex++) {
        const rowData = data[dataRowIndex];
        const excelRowNumber = dataRowIndex + 2; // +1 for header, +1 for 0-indexed

        const worksheetRow = worksheet.getRow(excelRowNumber);

        // Actualizar cada celda
        for (const [header, value] of Object.entries(rowData)) {
          const colIndex = columnMap.get(header);

          if (colIndex) {
            const cell = worksheetRow.getCell(colIndex);

            // Solo actualizar el valor, preservar fórmula si existe
            // Si la celda NO tiene fórmula, actualizar el valor
            if (!cell.formula) {
              cell.value = value as ExcelJS.CellValue;
            } else {
              // Si tiene fórmula, no tocar (las fórmulas se recalcularán)
              logger.debug(`Preserving formula in cell`, {
                row: excelRowNumber,
                col: colIndex,
                formula: cell.formula,
              });
            }
          }
        }

        // Commit la fila
        worksheetRow.commit();
      }

      // 5. Guardar el workbook modificado
      await workbook.xlsx.writeFile(outputPath);

      logger.info(`Successfully updated Excel file (formulas preserved)`, {
        outputPath,
        rowCount: data.length,
      });
    } catch (error) {
      logger.error(`Error updating Excel file: ${originalFilePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Escribe datos a un archivo Excel (método original - solo para archivos nuevos)
   */
  async writeExcel<T extends Record<string, unknown>>(
    data: T[],
    outputPath: string,
    sheetName = 'Hoja1'
  ): Promise<void> {
    try {
      logger.info(`Writing Excel file: ${outputPath}`);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      if (data.length === 0) {
        throw new Error('No data to write');
      }

      // Agregar headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Agregar datos (solo valores, sin fórmulas)
      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header];
          // Convertir valores para evitar problemas con fórmulas
          if (value === null || value === undefined) return null;
          return value;
        });
        worksheet.addRow(values);
      });

      // Auto-fit columns (aproximado)
      worksheet.columns.forEach((column) => {
        if (column.header) {
          column.width = Math.max(column.header.toString().length + 2, 10);
        }
      });

      // Guardar archivo
      await workbook.xlsx.writeFile(outputPath);
      logger.info(`Successfully wrote Excel file`, { outputPath, rowCount: data.length });
    } catch (error) {
      logger.error(`Error writing Excel file: ${outputPath}`, error as Error);
      throw error;
    }
  }

  /**
   * Obtiene los headers de un archivo Excel
   */
  async getHeaders(filePath: string, sheetName?: string): Promise<string[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const actualSheetName = sheetName || config.excelSheetName;
      const worksheet = workbook.getWorksheet(actualSheetName);

      if (!worksheet) {
        throw new Error(`Sheet "${actualSheetName}" not found`);
      }

      const headers: string[] = [];
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        const cellValue = cell.value;
        const rawHeader =
          typeof cellValue === 'string' || typeof cellValue === 'number'
            ? String(cellValue)
            : `Column${colNumber}`;
        headers[colNumber - 1] = this.normalizeHeader(rawHeader);
      });

      return headers;
    } catch (error) {
      logger.error(`Error getting headers from: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Valida que existan las columnas requeridas (case-insensitive, fuzzy)
   */
  async validateColumns(
    filePath: string,
    requiredColumns: readonly string[]
  ): Promise<{ valid: boolean; missing: string[]; suggestions: Map<string, string> }> {
    const headers = await this.getHeaders(filePath);
    const normalizedHeaders = headers.map((h) => this.normalizeHeaderForComparison(h));

    const missing: string[] = [];
    const suggestions = new Map<string, string>();

    for (const requiredCol of requiredColumns) {
      const normalizedRequired = this.normalizeHeaderForComparison(requiredCol);
      const foundIndex = normalizedHeaders.indexOf(normalizedRequired);

      if (foundIndex === -1) {
        missing.push(requiredCol);
      } else {
        const actualHeader = headers[foundIndex];
        if (actualHeader !== requiredCol) {
          suggestions.set(requiredCol, actualHeader);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      suggestions,
    };
  }

  /**
   * Copia un archivo
   */
  async copyFile(source: string, destination: string): Promise<void> {
    try {
      await fs.copyFile(source, destination);
      logger.info(`File copied successfully`, { source, destination });
    } catch (error) {
      logger.error(`Error copying file`, error as Error, { source, destination });
      throw error;
    }
  }

  /**
   * Aplica formato condicional a la columna DIFERENCIAS
   * Usa Conditional Formatting de Excel (mucho mejor que pintar celdas)
   */
  async applyDiferenciasColors(filePath: string, sheetName?: string): Promise<void> {
    try {
      logger.info('Aplicando formato condicional a columna DIFERENCIAS...');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const actualSheetName = sheetName || config.excelSheetName;
      const worksheet = workbook.getWorksheet(actualSheetName);

      if (!worksheet) {
        throw new Error(`Sheet "${actualSheetName}" not found`);
      }

      // Encontrar columna DIFERENCIAS
      const headers: string[] = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        const cellValue = cell.value;
        const headerStr =
          typeof cellValue === 'string' || typeof cellValue === 'number' ? String(cellValue) : '';
        headers[colNumber - 1] = this.normalizeHeader(headerStr);
      });

      const diferenciasColIndex = headers.indexOf('DIFERENCIAS');
      if (diferenciasColIndex === -1) {
        logger.warn('Columna DIFERENCIAS no encontrada');
        return;
      }

      const colLetter = this.numberToColumn(diferenciasColIndex + 1);
      const rowCount = worksheet.rowCount;
      const range = `${colLetter}2:${colLetter}${rowCount}`;

      logger.info(`Aplicando formato condicional al rango ${range}`);

      // Agregar reglas de formato condicional
      worksheet.addConditionalFormatting({
        ref: range,
        rules: [
          // Regla 1: Valores negativos = ROJO
          {
            type: 'cellIs',
            operator: 'lessThan',
            formulae: [0],
            style: {
              fill: {
                type: 'pattern',
                pattern: 'solid',
                bgColor: { argb: 'FFFFC7CE' },
              },
              font: {
                color: { argb: 'FFFF0000' },
                bold: true,
              },
            },
            priority: 1,
          },
          // Regla 2: Valores positivos = VERDE
          {
            type: 'cellIs',
            operator: 'greaterThan',
            formulae: [0],
            style: {
              fill: {
                type: 'pattern',
                pattern: 'solid',
                bgColor: { argb: 'FFC6EFCE' },
              },
              font: {
                color: { argb: 'FF006100' },
                bold: true,
              },
            },
            priority: 2,
          },
        ],
      });

      // Guardar
      await workbook.xlsx.writeFile(filePath);
      logger.info('Formato condicional aplicado exitosamente');
    } catch (error) {
      logger.error('Error aplicando formato condicional', error as Error);
      throw error;
    }
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.debug(`File deleted`, { filePath });
    } catch (error) {
      // Ignorar si el archivo no existe
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error(`Error deleting file`, error as Error, { filePath });
        throw error;
      }
    }
  }

  /**
   * Parsea el valor de una celda
   */
  private parseCellValue(value: ExcelJS.CellValue): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    // Si es un objeto de fecha de Excel
    if (value instanceof Date) {
      return value;
    }

    // Si es un objeto rico de Excel
    if (typeof value === 'object' && 'richText' in value) {
      return value.richText?.map((rt: { text: string }) => rt.text).join('');
    }

    // Si es una fórmula, retornar el resultado
    if (typeof value === 'object' && 'result' in value) {
      return value.result;
    }

    return value;
  }
}

// Singleton
export const excelService = new ExcelService();
