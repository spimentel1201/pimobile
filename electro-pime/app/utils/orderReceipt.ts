import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RepairOrder, Quote, RepairOrderStatus, Sale } from '../types/api';
import { ORDER_STATUS, quoteStatusStyle, PAYMENT_METHOD } from '../theme';
import { api } from '../services/api';

/** Escapa HTML para inyectar texto de la orden sin romper el documento. */
const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const TERMS_REQUEST =
  'En caso de que la oferta de servicio no sea aceptada y/o el equipo no sea retirado dentro de 120 días después del ingreso se considerará abandonado. En este caso la empresa adquiere su derecho sobre el equipo quedando facultada de disponer del equipo, perdiendo el cliente todo derecho, reclamo o indemnización alguna. Al efectuar la reparación le garantizamos las piezas renovadas por un periodo de 90 días, pero no por todo el equipo. Todo servicio incluyendo la revisión tiene un costo.';

/** Estado de la orden con etiqueta/colores del theme (fallback si aparece uno nuevo). */
const orderStatusStyle = (status: RepairOrderStatus) =>
  (ORDER_STATUS as Record<string, { label: string; color: string; soft: string } | undefined>)[
    status
  ] ?? { label: status, color: '#475467', soft: '#F6F7F9' };

/** Fecha corta tipo "8 oct 2026" para las tablas. */
const formatShortDate = (iso?: string): string => {
  if (!iso) return '—';
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'd MMM yyyy', { locale: es });
};

/** Cobro explícito de cada presupuesto (columna "Pagado" del recibo). */
const quotePaidState = (
  status: Quote['status'],
): { label: string; tone: 'yes' | 'no' | 'na'; detail: string } => {
  switch (status) {
    case 'PAID':
      return { label: 'Sí', tone: 'yes', detail: 'cobrado sin documento' };
    case 'INVOICED':
      return { label: 'Sí', tone: 'yes', detail: 'facturado — venta generada' };
    case 'APPROVED':
      return { label: 'No', tone: 'no', detail: 'pendiente de pago' };
    case 'PENDING':
      return { label: 'No', tone: 'no', detail: 'en revisión' };
    default:
      // REJECTED / EXPIRED: el presupuesto murió, no hay cobro que reportar.
      return { label: '—', tone: 'na', detail: 'sin cobro' };
  }
};

/** Concepto legible del presupuesto: primer ítem + conteo. */
const quoteConcept = (quote: Quote): string => {
  const items = quote.items || [];
  if (!items.length) return 'Sin detalle';
  const first = items[0].description || items[0].productName || 'Ítem';
  return items.length > 1 ? `${first} (+${items.length - 1})` : first;
};

/** Estados que ya dejaron plata: suman al "Cobrado" del pie. */
const QUOTE_COLLECTED: Quote['status'][] = ['PAID', 'INVOICED'];

export const generateOrderReceiptHTML = (order: RepairOrder, quotes: Quote[] = []) => {
  const items = order.items || [];

  // El "cargo por equipo" solo existe si el ítem trae precio propio.
  // `initialReviewCost` es un único monto de la ORDEN (campo del formulario),
  // por eso no se puede repetir en cada fila: Haría creer N × monto.
  const lineCost = (item: RepairOrder['items'][number]): number | null => {
    // Sin precio (o precio 0) se muestra "—" para no implying un cargo de S/ 0.00.
    if (item.price == null || item.price === 0) return null;
    return item.price * (item.quantity || 1);
  };

  const itemsTotal = items.reduce((sum, item) => sum + (lineCost(item) ?? 0), 0);
  const hasItemPrices = itemsTotal > 0;

  const reviewCost = order.initialReviewCost ?? 0;
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const money = (value: number) => `S/ ${value.toFixed(2)}`;

  // La fecha que importa es la de REGISTRO de la orden, no la de impresión.
  const formatDate = (iso: string) => {
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime())
      ? 'Fecha no disponible'
      : format(parsed, "d 'de' MMMM 'de' yyyy", { locale: es });
  };
  const registeredAt = formatDate(order.createdAt);
  const closedAt = order.endDate ? formatDate(order.endDate) : null;

  // Estado real de la orden (antes el badge estaba hardcodeado).
  const statusStyle = orderStatusStyle(order.status);

  const customerName = order.customer?.name || order.customerName || 'Cliente General';
  const technicianName = order.technician
    ? `${order.technician.firstName} ${order.technician.lastName}`.trim()
    : 'No Asignado';

  const rows = items
    .map((item) => {
      const cost = lineCost(item);
      const accessories = (item.accessories || []).filter(Boolean);
      return `
                  <tr>
                    <td>
                      <div class="cell-title">${escapeHtml(item.deviceType || 'Equipo')} · ${escapeHtml(item.brand)}</div>
                      <div class="cell-sub">Modelo: ${escapeHtml(item.model)}</div>
                    </td>
                    <td class="cell-serial">${escapeHtml(item.serialNumber || 'N/A')}</td>
                    <td>
                      <div class="cell-problem">${escapeHtml(item.problemDescription || 'Sin descripción')}</div>
                      ${accessories.length ? `<div class="acc-row">${accessories.map((acc) => `<span class="badge-acc">${escapeHtml(acc)}</span>`).join('')}</div>` : ''}
                    </td>
                    <td class="cell-qty">${item.quantity || 1}</td>
                    <td class="price-col">${cost == null ? '—' : money(cost)}</td>
                  </tr>`;
    })
    .join('');

  // Presupuestos ligados a la orden: código, concepto, fecha, estado,
  // cobro explícito (Sí/No) y monto, más totales al pie.
  const quoteRows = quotes
    .map((quote) => {
      const st = quoteStatusStyle(quote.status);
      const paid = quotePaidState(quote.status);
      const itemCount = quote.items?.length ?? 0;
      return `
                  <tr>
                    <td class="q-code">#${escapeHtml(quote.id.slice(0, 8).toUpperCase())}</td>
                    <td>
                      <div class="cell-title">${escapeHtml(quoteConcept(quote))}</div>
                      <div class="cell-sub">${itemCount} ${itemCount === 1 ? 'ítem' : 'ítems'}</div>
                    </td>
                    <td>${formatShortDate(quote.createdAt)}</td>
                    <td><span class="q-badge" style="background:${st.soft};color:${st.color}">${escapeHtml(st.label)}</span></td>
                    <td>
                      <span class="paid-pill paid-${paid.tone}">${paid.label}</span>
                      <div class="paid-sub">${escapeHtml(paid.detail)}</div>
                    </td>
                    <td class="price-col">${money(Number(quote.totalAmount) || 0)}</td>
                  </tr>`;
    })
    .join('');

  const quotesQuoted = quotes.reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);
  const quotesCollected = quotes
    .filter((q) => QUOTE_COLLECTED.includes(q.status))
    .reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);
  const quotesPending = quotes
    .filter((q) => q.status === 'APPROVED')
    .reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);

  // "Total General" del servicio: revisión + cargo por equipo + presupuestos
  // vigentes (aprobados/pagados/facturados). Antes se usaba solo
  // `order.totalCost`, que dejaba fuera los presupuestos y mostraba un total
  // menor a lo cobrado (p.ej. S/ 40.00 con un cobro de S/ 180.00).
  const quotesBillable = quotesCollected + quotesPending;
  const hasQuotes = quotes.length > 0;
  const totalCost = hasQuotes
    ? reviewCost + itemsTotal + quotesBillable
    : reviewCost + itemsTotal;

  const quotesSection = quotes.length
    ? `
          <div class="table-section">
            <h2 class="table-title">Presupuestos Vinculados (${quotes.length})</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 11%">Código</th>
                  <th>Concepto</th>
                  <th style="width: 12%">Fecha</th>
                  <th style="width: 16%">Estado</th>
                  <th style="width: 17%">Pagado</th>
                  <th style="width: 13%; text-align: right">Monto</th>
                </tr>
              </thead>
              <tbody>${quoteRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="5"><span class="q-foot-label">Total cotizado</span></td>
                  <td class="price-col">${money(quotesQuoted)}</td>
                </tr>
                <tr>
                  <td colspan="5"><span class="q-foot-label">Cobrado (pagado + facturado)</span></td>
                  <td class="price-col">${money(quotesCollected)}</td>
                </tr>
                <tr>
                  <td colspan="5"><span class="q-foot-label">Por cobrar (aprobado)</span></td>
                  <td class="price-col">${money(quotesPending)}</td>
                </tr>
              </tfoot>
            </table>
          </div>`
    : '';

  // Cobro acumulado (ventas generadas), si la orden lo reporta.
  const billedTotal = order.billing?.billedTotal ?? 0;
  const salesCount = order.billing?.salesCount ?? 0;

  // Por cobrar: revisión (si no está pagada) + presupuestos aprobados pendientes.
  const porCobrar = (order.reviewPaid ? 0 : reviewCost) + quotesPending;

  return `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

            /* A4 vertical con márgenes reales (el padding del body no aplica al imprimir). */
            @page { size: 210mm 297mm; margin: 8mm; }

            * { box-sizing: border-box; }
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1F2937; background: #fff; line-height: 1.35; margin: 0; padding: 0; min-height: 281mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media screen { body { padding: 10px; } }

            /* Evitar que un bloque se parta entre dos hojas */
            .card, .terms-box, .summary-box, .signature-section, table, tr { break-inside: avoid; page-break-inside: avoid; }

            .brand-header { text-align: center; margin-bottom: 6px; }
            .brand-name { font-size: 19px; font-weight: 800; color: #1E40AF; text-transform: uppercase; letter-spacing: -0.4px; }
            .brand-details { font-size: 9px; color: #6B7280; line-height: 1.3; max-width: 70%; margin: 2px auto 0; }

            .doc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; margin-bottom: 6px; }
            .header-badge { padding: 2px 8px; border-radius: 999px; display: inline-block; font-size: 9px; font-weight: 600; text-transform: uppercase; background: #DBEAFE; color: #1E40AF; }
            .doc-title { font-size: 17px; font-weight: 800; color: #111827; letter-spacing: -0.4px; line-height: 1.15; }
            .doc-subtitle { color: #6B7280; font-size: 9px; margin-top: 1px; }
            .doc-head-text { flex: 1; }

            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
            .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; }
            .card-title { font-size: 8px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.8px; }
            .card-content h3 { margin: 0; font-size: 12px; color: #111827; font-weight: 700; }
            .card-content p { margin: 0; color: #4B5563; font-size: 9.5px; line-height: 1.4; }

            .table-section { margin-bottom: 6px; }
            .table-title { font-size: 11px; font-weight: 700; margin-bottom: 5px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
            th { text-align: left; padding: 5px 7px; background: #F9FAFB; color: #6B7280; font-size: 8px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; letter-spacing: 0.4px; }
            td { padding: 5px 7px; border-bottom: 1px solid #E5E7EB; font-size: 9.5px; color: #1F2937; vertical-align: top; }
            tr:last-child td { border-bottom: none; }
            /* Encabezado de tabla se repite al partir la página */
            thead { display: table-header-group; }
            /* Un título nunca queda solo al final de una hoja */
            h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
            .cell-title { font-weight: 600; color: #111827; }
            .cell-sub { color: #6B7280; font-size: 8.5px; }
            .cell-serial { font-family: monospace; color: #4B5563; font-size: 8.5px; }
            .cell-problem { margin-bottom: 2px; }
            .cell-qty { text-align: center; color: #6B7280; }
            .price-col { font-weight: 700; color: #2563EB; text-align: right; white-space: nowrap; }

            .footer-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 8px; margin-bottom: 8px; }
            .terms-box { border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; background: #F9FAFB; }
            .terms-title { font-size: 8px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; color: #111827; letter-spacing: 0.5px; }
            .terms-text { font-size: 7.5px; color: #6B7280; line-height: 1.45; orphans: 3; widows: 3; }

            .summary-box { border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; background: #fff; }
            .summary-title { font-size: 8px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .summary-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px; font-size: 9.5px; color: #374151; }
            .summary-row.paid { color: #067647; font-weight: 600; }
            .total-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E5E7EB; font-size: 15px; font-weight: 800; color: #2563EB; }

            .acc-row { margin-top: 2px; }
            .badge-acc { font-size: 8px; background: #F3F4F6; padding: 1px 5px; border-radius: 3px; border: 1px solid #E5E7EB; display: inline-block; margin-right: 3px; color: #4B5563; }
            .q-badge { padding: 2px 8px; border-radius: 999px; display: inline-block; font-size: 8px; font-weight: 600; text-transform: uppercase; background: #F3F4F6; color: #475467; }
            .q-code { font-family: monospace; color: #4B5563; font-size: 8px; white-space: nowrap; }
            .paid-pill { padding: 1px 7px; border-radius: 999px; display: inline-block; font-size: 8px; font-weight: 700; text-transform: uppercase; }
            .paid-yes { background: #ECFDF3; color: #067647; }
            .paid-no { background: #FFFAEB; color: #B54708; }
            .paid-na { background: #F3F4F6; color: #6B7280; }
            .paid-sub { color: #6B7280; font-size: 8px; margin-top: 1px; }
            tfoot td { background: #F9FAFB; border-top: 1px solid #E5E7EB; font-size: 9.5px; }
            .q-foot-label { color: #6B7280; font-weight: 700; text-transform: uppercase; font-size: 8px; letter-spacing: 0.4px; }

            /* Espacio real para rubrar: aire por encima de la linea. */
            .signature-section { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 34px; }
            .signature-block { width: 46%; }
            .signature-line { border-top: 1px solid #6B7280; text-align: center; padding-top: 4px; }
            .signature-text { font-size: 8px; font-weight: 700; color: #6B7280; text-transform: uppercase; }
            .signature-space { width: 46%; }
          </style>
        </head>
        <body>
          <div class="brand-header">
            <div class="brand-name">Electrónica Pimentel</div>
            <div class="brand-details">
              Av. Principal 123, Lima • Tel: 555-0123 • contacto@pimentel.com<br>
              Especialistas en Reparación de Electrodomésticos
            </div>
          </div>

          <div class="doc-head">
            <div class="doc-head-text">
              <h1 class="doc-title">Orden #${escapeHtml(order.id.slice(0, 8).toUpperCase())}</h1>
              <div class="doc-subtitle">Registrado el ${escapeHtml(registeredAt)}${closedAt ? ` · Cerrado el ${escapeHtml(closedAt)}` : ''}</div>
            </div>
            <span class="header-badge" style="background:${statusStyle.soft};color:${statusStyle.color}">${escapeHtml(statusStyle.label)}</span>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title">Detalles del Cliente</div>
              <div class="card-content">
                <h3>${escapeHtml(customerName)}</h3>
                ${order.customer?.email ? `<p>${escapeHtml(order.customer.email)}</p>` : ''}
                ${order.customer?.address ? `<p>${escapeHtml(order.customer.address)}</p>` : ''}
                ${order.customer?.phone ? `<p>${escapeHtml(order.customer.phone)}</p>` : ''}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Técnico de Servicio</div>
              <div class="card-content">
                <h3>${escapeHtml(technicianName)}</h3>
                ${order.technician?.email ? `<p>${escapeHtml(order.technician.email)}</p>` : ''}
                <p>Nivel: Técnico Certificado</p>
              </div>
            </div>
          </div>

          <div class="table-section">
            <h2 class="table-title">Equipos Registrados</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 30%">Marca y Modelo</th>
                  <th style="width: 15%">N° de Serie</th>
                  <th style="width: 37%">Problema/Accesorios</th>
                  <th style="width: 6%; text-align: center">Cant.</th>
                  <th style="width: 12%; text-align: right">Cargo</th>
                </tr>
              </thead>
              <tbody>${rows || '<tr><td colspan="5">Sin equipos registrados</td></tr>'}</tbody>
            </table>
          </div>

          ${quotesSection}

          <div class="footer-grid">
            <div class="terms-box">
              <div class="terms-title">Términos y Condiciones</div>
              <div class="terms-text">${escapeHtml(TERMS_REQUEST)}</div>
            </div>

            <div class="summary-box">
              <div class="summary-title">Resumen Total</div>
              <div class="summary-row">
                <span>Revisión inicial${totalUnits > 1 ? ` (${totalUnits} equipos)` : ''}</span>
                <span>${money(reviewCost)}</span>
              </div>
              ${hasItemPrices ? `<div class="summary-row"><span>Equipos (precio estimado)</span><span>${money(itemsTotal)}</span></div>` : ''}
              ${billedTotal > 0 || order.reviewPaid ? `<div class="summary-row paid"><span>Cobrado${salesCount ? ` (${salesCount} venta${salesCount > 1 ? 's' : ''})` : ''}${order.reviewPaid ? ' · rev. pagada' : ''}</span><span>${money(billedTotal + (order.reviewPaid ? reviewCost : 0))}</span></div>` : ''}
              ${porCobrar > 0 ? `<div class="summary-row"><span>Por cobrar</span><span>${money(porCobrar)}</span></div>` : ''}
              <div class="total-row">
                <span>Total General</span>
                <span>${money(totalCost)}</span>
              </div>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-space"></div>
            <div class="signature-block">
              <div class="signature-line">
                <div class="signature-text">Firma del Cliente</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
};

/**
 * Imprime el recibo en web dentro de un iframe oculto:
 * - no depende de ventanas emergentes (el popup-blocker no lo bloquea);
 * - espera a que carguen las fuentes web (máx. 1.5s) para que la salida
 *   no salga con la tipografía de respaldo;
 * - dispara `print()` una sola vez (el antiguo onload + setTimeout imprimía
 *   dos veces) y limpia el iframe al cerrar el diálogo.
 */
const printInWebFrame = (html: string): Promise<void> =>
  new Promise((resolve, reject) => {
    try {
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('title', 'Recibo de la orden');
      frame.style.cssText =
        'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
      frame.srcdoc = html;
      document.body.appendChild(frame);

      let printed = false;
      const doPrint = () => {
        if (printed) return;
        printed = true;
        try {
          const win = frame.contentWindow;
          if (!win) throw new Error('iframe de impresión no disponible');
          win.focus();
          win.print(); // modal: bloquea hasta cerrar el diálogo
          frame.remove();
          resolve();
        } catch (err) {
          frame.remove();
          reject(err);
        }
      };

      frame.onload = () => {
        const fontsReady = frame.contentDocument?.fonts?.ready;
        const timeout = new Promise((r) => setTimeout(r, 1500));
        Promise.race([fontsReady ?? Promise.resolve(), timeout])
          .then(doPrint)
          .catch(doPrint);
      };

      // Red de seguridad: si onload no llega, imprime igual (una sola vez)
      setTimeout(doPrint, 4000);
    } catch (err) {
      reject(err);
    }
  });

export interface ReceiptData {
  /** Orden usada para el recibo (la recién cargada si tuvo éxito). */
  order: RepairOrder;
  /** Presupuestos ligados a la orden (vacío si la carga falló). */
  quotes: Quote[];
}

/**
 * Trae los datos frescos del recibo: la orden por ID + sus presupuestos.
 *
 * El listado de órdenes no trae `billing` (el backend solo lo calcula en
 * GET /repair-orders/:id), así que se re-carga por ID: si no, al imprimir
 * desde el listado no saldría la fila "Cobrado". Si la carga falla se usa la
 * orden recibida y el recibo sale igual, sin ese dato.
 */
export const fetchOrderReceiptData = async (order: RepairOrder): Promise<ReceiptData> => {
  const [freshOrder, quotes] = await Promise.all([
    api.getRepairOrderById(order.id).catch(() => null),
    // Los presupuestos ligados enriquecen el recibo (estado y cobros).
    api.getQuotesByRepairOrder(order.id).catch(() => [] as Quote[]),
  ]);
  return { order: freshOrder ?? order, quotes };
};

/**
 * Abre el diálogo de impresión del SO / navegador con un HTML ya formateado.
 *
 * En web se usa un iframe oculto con `srcdoc` (react-native-web no implementa
 * `Print.printAsync`); en nativo va directo a expo-print.
 */
export const printReceiptHTML = async (html: string): Promise<void> => {
  if (Platform.OS === 'web') {
    await printInWebFrame(html);
    return;
  }

  try {
    await Print.printAsync({ html });
  } catch (error) {
    // Respaldo cuando el diálogo de impresión del SO no se abre: se genera
    // un PDF y se abre la hoja de compartir, así el ticket igual sale.
    console.warn('printAsync falló, usando printToFileAsync + compartir:', error);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Ticket' });
      return;
    }
    throw error;
  }
};

/** Genera el HTML A4 de un presupuesto (cotización). */
export const generateQuoteReceiptHTML = (quote: Quote) => {
  const money = (v: number) => `S/ ${v.toFixed(2)}`;
  const status = quoteStatusStyle(quote.status);
  const registeredAt = (() => {
    const parsed = new Date(quote.createdAt);
    return Number.isNaN(parsed.getTime())
      ? 'Fecha no disponible'
      : format(parsed, "d 'de' MMMM 'de' yyyy", { locale: es });
  })();

  const customerName = quote.customer?.name || quote.customerName || 'Cliente General';
  const technicianName = quote.technician
    ? `${quote.technician.firstName} ${quote.technician.lastName}`.trim()
    : 'No Asignado';

  const rows = (quote.items || [])
    .map((item) => {
      const price = item.price ?? item.unitPrice ?? 0;
      const qty = item.quantity || 1;
      return `
                  <tr>
                    <td>
                      <div class="cell-title">${escapeHtml(item.productName || item.description || 'Ítem')}</div>
                      ${item.productId ? `<div class="cell-sub">Ref: ${escapeHtml(item.productId)}</div>` : ''}
                    </td>
                    <td class="cell-qty">${qty}</td>
                    <td class="price-col">${money(price)}</td>
                    <td class="price-col">${money(price * qty)}</td>
                  </tr>`;
    })
    .join('');

  return `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            @page { size: 210mm 297mm; margin: 8mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1F2937; background: #fff; line-height: 1.35; margin: 0; padding: 0; min-height: 281mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media screen { body { padding: 10px; } }
            .brand-header { text-align: center; margin-bottom: 6px; }
            .brand-name { font-size: 19px; font-weight: 800; color: #1E40AF; text-transform: uppercase; letter-spacing: -0.4px; }
            .brand-details { font-size: 9px; color: #6B7280; line-height: 1.3; max-width: 70%; margin: 2px auto 0; }
            .doc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; margin-bottom: 8px; }
            .header-badge { padding: 2px 8px; border-radius: 999px; display: inline-block; font-size: 9px; font-weight: 600; text-transform: uppercase; }
            .doc-title { font-size: 17px; font-weight: 800; color: #111827; letter-spacing: -0.4px; line-height: 1.15; }
            .doc-subtitle { color: #6B7280; font-size: 9px; margin-top: 1px; }
            .doc-head-text { flex: 1; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
            .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; }
            .card-title { font-size: 8px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.8px; }
            .card-content h3 { margin: 0; font-size: 12px; color: #111827; font-weight: 700; }
            .card-content p { margin: 0; color: #4B5563; font-size: 9.5px; line-height: 1.4; }
            .table-section { margin-bottom: 8px; }
            .table-title { font-size: 11px; font-weight: 700; margin-bottom: 5px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
            th { text-align: left; padding: 5px 7px; background: #F9FAFB; color: #6B7280; font-size: 8px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; letter-spacing: 0.4px; }
            td { padding: 5px 7px; border-bottom: 1px solid #E5E7EB; font-size: 9.5px; color: #1F2937; vertical-align: top; }
            tr:last-child td { border-bottom: none; }
            thead { display: table-header-group; }
            .cell-title { font-weight: 600; color: #111827; }
            .cell-sub { color: #6B7280; font-size: 8.5px; }
            .cell-qty { text-align: center; color: #6B7280; }
            .price-col { font-weight: 700; color: #2563EB; text-align: right; white-space: nowrap; }
            .footer-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 8px; margin-bottom: 8px; }
            .terms-box { border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; background: #F9FAFB; }
            .terms-title { font-size: 8px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; color: #111827; letter-spacing: 0.5px; }
            .terms-text { font-size: 7.5px; color: #6B7280; line-height: 1.45; orphans: 3; widows: 3; }
            .summary-box { border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; background: #fff; }
            .summary-title { font-size: 8px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .summary-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px; font-size: 9.5px; color: #374151; }
            .total-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E5E7EB; font-size: 15px; font-weight: 800; color: #2563EB; }
            .signature-section { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 34px; }
            .signature-block { width: 46%; }
            .signature-line { border-top: 1px solid #6B7280; text-align: center; padding-top: 4px; }
            .signature-text { font-size: 8px; font-weight: 700; color: #6B7280; text-transform: uppercase; }
            .signature-space { width: 46%; }
          </style>
        </head>
        <body>
          <div class="brand-header">
            <div class="brand-name">Electrónica Pimentel</div>
            <div class="brand-details">
              Av. Principal 123, Lima • Tel: 555-0123 • contacto@pimentel.com<br>
              Especialistas en Reparación de Electrodomésticos
            </div>
          </div>

          <div class="doc-head">
            <div class="doc-head-text">
              <h1 class="doc-title">Presupuesto COT-${escapeHtml(quote.id.slice(0, 6).toUpperCase())}</h1>
              <div class="doc-subtitle">Emitido el ${escapeHtml(registeredAt)}</div>
            </div>
            <span class="header-badge" style="background:${status.soft};color:${status.color}">${escapeHtml(status.label)}</span>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title">Cliente</div>
              <div class="card-content">
                <h3>${escapeHtml(customerName)}</h3>
                ${quote.customer?.email ? `<p>${escapeHtml(quote.customer.email)}</p>` : ''}
                ${quote.customer?.phone ? `<p>${escapeHtml(quote.customer.phone)}</p>` : ''}
              </div>
            </div>
            <div class="card">
              <div class="card-title">Técnico</div>
              <div class="card-content">
                <h3>${escapeHtml(technicianName)}</h3>
                ${quote.technician?.email ? `<p>${escapeHtml(quote.technician.email)}</p>` : ''}
              </div>
            </div>
          </div>

          <div class="table-section">
            <h2 class="table-title">Detalle del Presupuesto</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 50%">Ítem</th>
                  <th style="width: 12%; text-align: center">Cant.</th>
                  <th style="width: 19%; text-align: right">P. Unit.</th>
                  <th style="width: 19%; text-align: right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${rows || '<tr><td colspan="4">Sin ítems</td></tr>'}</tbody>
            </table>
          </div>

          <div class="footer-grid">
            <div class="terms-box">
              <div class="terms-title">Términos y Condiciones</div>
              <div class="terms-text">Presupuesto sujeto a revisión técnica final. Los precios incluyen mano de obra y repuestos estimados.</div>
            </div>
            <div class="summary-box">
              <div class="summary-title">Resumen</div>
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${money(Number(quote.totalAmount))}</span>
              </div>
              <div class="total-row">
                <span>Total</span>
                <span>${money(Number(quote.totalAmount))}</span>
              </div>
              ${quote.repairOrderId ? `<div class="summary-row"><span>Orden vinculada</span><span>#${escapeHtml(quote.repairOrderId.slice(0, 8).toUpperCase())}</span></div>` : ''}
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-space"></div>
            <div class="signature-block">
              <div class="signature-line">
                <div class="signature-text">Firma del Cliente</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
};

export const printQuoteReceipt = async (quote: Quote) => {
  try {
    const html = generateQuoteReceiptHTML(quote);
    if (Platform.OS === 'web') {
      await printInWebFrame(html);
      return;
    }
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Error printing quote receipt:', error);
    throw error;
  }
};

// ============================================================
// Ticket de venta (POS)
// ============================================================

export type TicketSize = '58' | '80' | 'A4' | 'LETTER';

/** Genera el HTML del ticket de venta para 58 mm, 80 mm, A4 o Carta. */
export const generateSaleReceiptHTML = (sale: Sale, size: TicketSize = '80') => {
  const money = (value: number) => `S/ ${Number(value || 0).toFixed(2)}`;
  const payment = PAYMENT_METHOD[sale.paymentMethod]?.label ?? sale.paymentMethod;
  const created = new Date(sale.createdAt);
  const dateText = Number.isNaN(created.getTime())
    ? 'Fecha no disponible'
    : format(created, "d MMM yyyy · HH:mm", { locale: es });
  const customer = sale.customerFullName || sale.customerName || 'Cliente General';
  const seller = sale.userName || 'No registrado';

  const isNarrow = size === '58' || size === '80';
  const pageSize =
    size === '58' ? '58mm auto' : size === '80' ? '80mm auto' : size === 'A4' ? 'A4' : 'Letter';
  const bodyWidth = size === '58' ? '58mm' : '80mm';

  const rows = (sale.items || [])
    .map((item) => {
      const qty = item.quantity || 1;
      const price = Number(item.price || 0);
      const name = item.productName || item.description || item.productDescription || 'Producto';
      return `
      <div class="item">
        <div class="item-name">${escapeHtml(name)}</div>
        <div class="item-line">
          <span>${qty} x ${money(price)}</span>
          <span>${money(price * qty)}</span>
        </div>
      </div>`;
    })
    .join('');

  return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: ${pageSize}; margin: ${isNarrow ? '0' : '12mm'}; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Courier New', ui-monospace, monospace;
              color: #000;
              margin: 0 auto;
              width: ${isNarrow ? bodyWidth : '100%'};
              padding: ${isNarrow ? '4mm 3mm' : '0'};
              font-size: ${isNarrow ? '11px' : '13px'};
              line-height: 1.35;
            }
            .center { text-align: center; }
            .brand { font-size: ${isNarrow ? '15px' : '20px'}; font-weight: 700; letter-spacing: 1px; }
            .muted { color: #555; }
            .small { font-size: ${isNarrow ? '10px' : '11px'}; }
            hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; gap: 8px; }
            .row span:last-child { text-align: right; }
            .item { margin: 4px 0; }
            .item-name { word-break: break-word; font-weight: 600; }
            .item-line { display: flex; justify-content: space-between; gap: 8px; color: #333; font-size: ${isNarrow ? '10px' : '12px'}; }
            .total { font-size: ${isNarrow ? '14px' : '18px'}; font-weight: 700; }
            .footer { margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="brand center">ELECTRO-PIME</div>
          <div class="center small">Servicio Técnico y Repuestos</div>
          <div class="center small muted">Ticket #${escapeHtml(sale.id.slice(0, 8).toUpperCase())}</div>
          <hr />
          <div class="row"><span>Fecha</span><span>${escapeHtml(dateText)}</span></div>
          <div class="row"><span>Cliente</span><span>${escapeHtml(customer)}</span></div>
          <div class="row"><span>Atendido por</span><span>${escapeHtml(seller)}</span></div>
          <div class="row"><span>Pago</span><span>${escapeHtml(payment)}</span></div>
          <hr />
          ${rows || '<div class="center small muted">Sin ítems</div>'}
          <hr />
          <div class="row total"><span>TOTAL</span><span>${money(sale.totalAmount)}</span></div>
          <hr />
          <div class="center small muted footer">¡Gracias por su preferencia!</div>
        </body>
      </html>
    `;
};

/** Imprime el ticket de venta (un solo diálogo, sin la UI de la app). */
export const printSaleReceipt = async (sale: Sale, size: TicketSize = '80') => {
  try {
    await printReceiptHTML(generateSaleReceiptHTML(sale, size));
  } catch (error) {
    console.error('Error printing sale receipt:', error);
    throw error;
  }
};
