/**
 * Modelo y validación para el archivo de Facturación
 */
import { z } from 'zod';

// Schema para una fila del archivo de facturación (CON COERCIÓN)
export const FacturacionRowSchema = z.object({
  EXPEDIENTE: z.coerce.number().int().positive(), // Convierte string → number
  Siniestro: z.coerce.number().optional().nullable(),
  'Folio 1': z.coerce.number().int().positive(),
  'Factura 1': z.coerce.string().min(1), // Convierte number → string si es necesario
  'Monto 1': z.coerce.number().positive(),
  'Folio 2': z.coerce.number().int().positive().optional().nullable(),
  'Factura 2': z.coerce.string().optional().nullable(),
  'Monto 2': z.coerce.number().positive().optional().nullable(),
  'Folio 3': z.coerce.number().int().positive().optional().nullable(), // Normalizado (sin espacio)
  'Factura 3': z.coerce.string().optional().nullable(),
  'Monto 3': z.coerce.number().positive().optional().nullable(),
  'Folio 4': z.coerce.number().int().positive().optional().nullable(),
  'Factura 4': z.coerce.string().optional().nullable(),
  'Monto 4': z.coerce.number().positive().optional().nullable(),
  'Folio 5': z.coerce.number().int().positive().optional().nullable(),
  'Factura 5': z.coerce.string().optional().nullable(),
  'Monto 5': z.coerce.number().positive().optional().nullable(),
  'Vehículo': z.coerce.string().optional().nullable(),
});

export type FacturacionRow = z.infer<typeof FacturacionRowSchema>;

// Schema para el archivo completo
export const FacturacionFileSchema = z.object({
  sheetName: z.string().default('Hoja1'),
  rows: z.array(FacturacionRowSchema).min(1),
  rowCount: z.number().int().positive(),
  columnCount: z.number().int().positive(),
});

export type FacturacionFile = z.infer<typeof FacturacionFileSchema>;

// Columnas requeridas para validación
export const FACTURACION_REQUIRED_COLUMNS = [
  'EXPEDIENTE',
  'Folio 1',
  'Factura 1',
  'Monto 1',
] as const;

// Todas las columnas esperadas
export const FACTURACION_ALL_COLUMNS = [
  'EXPEDIENTE',
  'Siniestro',
  'Folio 1',
  'Factura 1',
  'Monto 1',
  'Folio 2',
  'Factura 2',
  'Monto 2',
  'Folio 3',
  'Factura 3',
  'Monto 3',
  'Folio 4',
  'Factura 4',
  'Monto 4',
  'Folio 5',
  'Factura 5',
  'Monto 5',
  'Vehículo',
] as const;

export type FacturacionColumn = typeof FACTURACION_ALL_COLUMNS[number];
