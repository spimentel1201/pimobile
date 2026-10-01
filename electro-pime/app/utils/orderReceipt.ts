import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RepairOrder } from '../types/api';

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

export const generateOrderReceiptHTML = (order: RepairOrder) => {
  const items = order.items || [];

  // El "cargo por equipo" solo existe si el ítem trae precio propio.
  // `initialReviewCost` es un único monto de la ORDEN (campo del formulario),
  // por eso no se puede repetir en cada fila: Doing so haría creer N × monto.
  const lineCost = (item: RepairOrder['items'][number]): number | null => {
    if (item.price == null) return null;
    return item.price * (item.quantity || 1);
  };

  const itemsTotal = items.reduce((sum, item) => sum + (lineCost(item) ?? 0), 0);
  const hasItemPrices = itemsTotal > 0;

  const reviewCost = order.initialReviewCost ?? 0;
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalCost = order.totalCost ?? reviewCost + itemsTotal;

  const money = (value: number) => `S/ ${value.toFixed(2)}`;

  // La fecha que importa es la de REGISTRO de la orden, no la de impresión.
  const registeredAt = (() => {
    const parsed = new Date(order.createdAt);
    return Number.isNaN(parsed.getTime())
      ? 'Fecha no disponible'
      : format(parsed, "d 'de' MMMM 'de' yyyy", { locale: es });
  })();

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

  return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

            /* Márgenes de impresión reales: el padding del body no aplica al imprimir. */
            @page { size: A4; margin: 8mm; }

            * { box-sizing: border-box; }
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1F2937; background: #fff; line-height: 1.35; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            @media screen { body { padding: 10px; } }

            /* Evitar que un bloque se parta entre dos hojas */
            .card, .terms-box, .summary-box, .signature-section, table, tr { break-inside: avoid; page-break-inside: avoid; }

            .brand-header { text-align: center; margin-bottom: 8px; }
            .brand-name { font-size: 19px; font-weight: 800; color: #1E40AF; text-transform: uppercase; letter-spacing: -0.4px; }
            .brand-details { font-size: 9px; color: #6B7280; line-height: 1.3; max-width: 70%; margin: 2px auto 0; }

            .doc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; margin-bottom: 8px; }
            .header-badge { background: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 999px; display: inline-block; font-size: 9px; font-weight: 600; text-transform: uppercase; }
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
            .cell-title { font-weight: 600; color: #111827; }
            .cell-sub { color: #6B7280; font-size: 8.5px; }
            .cell-serial { font-family: monospace; color: #4B5563; font-size: 8.5px; }
            .cell-problem { margin-bottom: 2px; }
            .cell-qty { text-align: center; color: #6B7280; }
            .price-col { font-weight: 700; color: #2563EB; text-align: right; white-space: nowrap; }

            .footer-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 8px; margin-bottom: 10px; }
            .terms-box { border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; background: #F9FAFB; }
            .terms-title { font-size: 8px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; color: #111827; letter-spacing: 0.5px; }
            .terms-text { font-size: 7.5px; color: #6B7280; line-height: 1.45; }

            .summary-box { border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; background: #fff; }
            .summary-title { font-size: 8px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .summary-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px; font-size: 9.5px; color: #374151; }
            .total-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E5E7EB; font-size: 15px; font-weight: 800; color: #2563EB; }

            .acc-row { margin-top: 2px; }
            .badge-acc { font-size: 8px; background: #F3F4F6; padding: 1px 5px; border-radius: 3px; border: 1px solid #E5E7EB; display: inline-block; margin-right: 3px; color: #4B5563; }

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
              <div class="doc-subtitle">Registrado el ${escapeHtml(registeredAt)}</div>
            </div>
            <span class="header-badge">Orden en Reparación</span>
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

export const printOrderReceipt = async (order: RepairOrder) => {
  try {
    const html = generateOrderReceiptHTML(order);

    if (Platform.OS === 'web') {
      // En web, abrimos una nueva ventana para imprimir solo el recibo
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        // Esperar a que cargue y luego imprimir
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        // Fallback por si onload no dispara
        setTimeout(() => {
          if (printWindow) {
            printWindow.print();
          }
        }, 500);

        return;
      }
    }

    await Print.printAsync({ html });
  } catch (error) {
    console.error('Error printing receipt:', error);
    throw error;
  }
};