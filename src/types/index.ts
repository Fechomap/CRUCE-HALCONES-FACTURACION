/**
 * Global type definitions
 */

export interface AppContext {
  sessionId: string;
  userId: number;
  username?: string;
  timestamp: Date;
}

export interface FileMetadata {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ProcessResult {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: string[];
}

export interface MatchingStats {
  processedCount: number;
  matchedCount: number;
  notFoundCount: number;
  duplicatesCount: number;
  unfacturedCount: number;
  discrepanciesCount: number;
  totalAmount: number;
}

export interface ExpedienteMatch {
  expediente: number;
  found: boolean;
  duplicated: boolean;
  occurrences?: number;
  indices?: number[];
}

export interface ExpedienteNotFound {
  expediente: number;
  folio1: number;
  factura1: string;
  monto1: number;
}

export interface ExpedienteDuplicate {
  expediente: number;
  occurrences: number;
  indices: number[];
}

export interface ExpedienteUnfactured {
  expediente: number;
  totalServicio: number;
  fecha: Date;
}

export interface MontoDiscrepancy {
  expediente: number;
  montoFacturado: number;
  totalServicio: number;
  diferencia: number;
  diferenciaPct: number;
}

export interface MatchingReport {
  stats: MatchingStats;
  encontrados: ExpedienteMatch[];
  noEncontrados: ExpedienteNotFound[];
  duplicados: ExpedienteDuplicate[];
  sinFacturar: ExpedienteUnfactured[];
  discrepancias: MontoDiscrepancy[];
  generatedAt: Date;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  userId?: number;
  action?: string;
  expediente?: number;
  [key: string]: unknown;
}
