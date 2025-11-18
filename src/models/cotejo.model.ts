/**
 * Modelo y validación para el archivo Base de Cotejo
 */
import { z } from 'zod';

// Schema simplificado para las columnas principales que usaremos
export const CotejoRowSchema = z.object({
  'CONSE ': z.number().int().positive(),
  'CONSE .1': z.number().int().positive(),
  'F/V': z.string().optional().nullable(),
  Aseguradora: z.string(),
  SUBCUENTA: z.string(),
  'Estatus del servicio': z.string(),
  'Tipo de servicio': z.string(),
  'Tipo de viaje': z.string().optional().nullable(),
  EXPEDIENTE: z.number().int().positive(),
  Siniestro: z.number().optional().nullable(),
  'Folio 1': z.number().optional().nullable(),
  'Factura 1': z.union([z.string(), z.number()]).optional().nullable(),
  'Monto 1': z.number().default(0),
  'Folio 2': z.number().optional().nullable(),
  'Factura 2': z.union([z.string(), z.number()]).optional().nullable(),
  'Monto 2': z.number().default(0),
  'Folio 3': z.number().optional().nullable(), // Normalizado
  'Factura 3': z.union([z.string(), z.number()]).optional().nullable(),
  'Monto 3': z.number().default(0),
  'Folio 4': z.number().optional().nullable(),
  'Factura 4': z.union([z.string(), z.number()]).optional().nullable(),
  'Monto 4': z.number().default(0),
  'Folio 5': z.number().optional().nullable(),
  'Factura 5': z.union([z.string(), z.number()]).optional().nullable(),
  'Monto 5': z.number().default(0),
  Vehículo: z.string().optional().nullable(),
  TOTAL: z.number().default(0),
  'COBRADO // FACTURADO': z.number().default(0),
  DIFERENCIAS: z.number().default(0),
  FECHA: z.date().optional().nullable(),
});

export type CotejoRow = z.infer<typeof CotejoRowSchema>;

// Columnas requeridas mínimas
export const COTEJO_REQUIRED_COLUMNS = [
  'EXPEDIENTE',
  'TOTAL',
  'COBRADO // FACTURADO',
  'DIFERENCIAS',
] as const;

export type CotejoColumn = (typeof COTEJO_REQUIRED_COLUMNS)[number];
