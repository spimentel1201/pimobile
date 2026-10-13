import { Quote, QuoteStatus } from '../types/api';
import { StatusStyle, quoteStatusStyle } from '../theme';

export interface QuoteSummaryRow {
  status: QuoteStatus;
  /** Etiqueta + colores del tema (con guard para estados desconocidos) */
  style: StatusStyle;
  /** Cantidad de presupuestos en ese estado */
  count: number;
  /** Suma de `totalAmount` de esos presupuestos */
  amount: number;
}

/** Orden de lectura del ciclo quote-to-cash; rechazados y expirados al final. */
const LIFECYCLE: QuoteStatus[] = [
  'PENDING',
  'APPROVED',
  'PAID',
  'INVOICED',
  'REJECTED',
  'EXPIRED',
];

const emptyRow = (status: QuoteStatus): QuoteSummaryRow => ({
  status,
  style: quoteStatusStyle(status),
  count: 0,
  amount: 0,
});

/**
 * Agrupa los presupuestos por estado (Dashboard / Reportes): conteo y monto.
 *
 * Siempre devuelve las 6 filas del ciclo (las vacías en 0) más cualquier
 * estado desconocido que mande el backend, para que la tabla no cambie de
 * tamaño según los datos.
 */
export function summarizeQuotesByStatus(quotes: Quote[]): QuoteSummaryRow[] {
  const rows = new Map<QuoteStatus, QuoteSummaryRow>(LIFECYCLE.map((s) => [s, emptyRow(s)]));

  for (const quote of quotes) {
    const row = rows.get(quote.status) ?? emptyRow(quote.status);
    row.count += 1;
    row.amount += quote.totalAmount ?? 0;
    rows.set(quote.status, row);
  }

  return Array.from(rows.values());
}

export interface QuoteMoneyTotals {
  /** Aprobado y todavía sin cobrar */
  porCobrar: number;
  /** Cobrado (PAID) */
  cobrado: number;
  /** Facturado (INVOICED: la venta ya se generó) */
  facturado: number;
}

const sumByStatus = (quotes: Quote[], status: QuoteStatus): number =>
  quotes
    .filter((q) => q.status === status)
    .reduce((total, q) => total + (q.totalAmount ?? 0), 0);

/** Totales monetarios del ciclo quote-to-cash, por etapa de cobro. */
export function quoteMoneyTotals(quotes: Quote[]): QuoteMoneyTotals {
  return {
    porCobrar: sumByStatus(quotes, 'APPROVED'),
    cobrado: sumByStatus(quotes, 'PAID'),
    facturado: sumByStatus(quotes, 'INVOICED'),
  };
}
