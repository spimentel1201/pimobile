import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { RepairOrder } from '../types/api';

export const generateOrderReceiptHTML = (order: RepairOrder) => {
  const termsRequest = "En caso de que la oferta de servicio no sea aceptada y/o el equipo no sea retirado dentro de 120 días depués del ingreso se considerará abandonado. En este caso la empresa adquiere su derecho sobre el equipo quedando facultado de disponer del equipo, perdiendo el cliente todo derecho, reclamo o indemnización alguna. Al efectuar la reparación le garantizamos las piezas renovadas por un peiodo de 90 días, pero no por todo el equipo. Todo servicio incluyendo la revisión tiene un costo.";

  return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 40px; color: #1F2937; background: #fff; line-height: 1.5; -webkit-print-color-adjust: exact; }
            
            .brand-header { text-align: center; margin-bottom: 30px; }
            .brand-name { font-size: 28px; font-weight: 800; color: #1E40AF; text-transform: uppercase; margin-bottom: 5px; letter-spacing: -0.5px; }
            .brand-details { font-size: 11px; color: #6B7280; line-height: 1.4; max-width: 80%; margin: 0 auto; }
            
            .header-badge { background: #DBEAFE; color: #1E40AF; padding: 4px 12px; border-radius: 999px; display: inline-block; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px; }
            .page-title { font-size: 24px; font-weight: 800; margin: 0; color: #111827; letter-spacing: -0.5px; }
            .page-subtitle { color: #6B7280; font-size: 13px; margin-top: 5px; }
            
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
            .card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .card-title { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
            .card-content h3 { margin: 0 0 5px 0; font-size: 16px; color: #111827; font-weight: 700; }
            .card-content p { margin: 0; color: #4B5563; font-size: 13px; line-height: 1.6; }

            .table-section { margin-top: 30px; }
            .table-title { font-size: 16px; font-weight: 700; margin-bottom: 15px; color: #111827; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; }
            th { text-align: left; padding: 12px 15px; background: #F9FAFB; color: #6B7280; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; letter-spacing: 0.5px; }
            td { padding: 12px 15px; border-bottom: 1px solid #E5E7EB; font-size: 13px; color: #1F2937; vertical-align: top; }
            tr:last-child td { border-bottom: none; }
            .price-col { font-weight: 600; color: #2563EB; text-align: right; }
            
            .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-top: 30px; }
            .terms-box { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; background: #F9FAFB; }
            .terms-title { font-size: 11px; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; color: #111827; }
            .terms-text { font-size: 9px; color: #6B7280; text-align: justify; line-height: 1.6; }
            
            .summary-box { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; background: #fff; }
            .summary-title { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.5px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #374151; }
            .total-row { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #E5E7EB; font-size: 20px; font-weight: 800; color: #2563EB; }

            .badge-acc { font-size: 11px; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; border: 1px solid #E5E7EB; margin-right: 4px; display: inline-block; margin-bottom: 4px; color: #4B5563; }
            
            .signature-section { margin-top: 60px; display: flex; justify-content: flex-end; padding-right: 20px; }
            .signature-line { border-top: 1px solid #9CA3AF; width: 200px; text-align: center; padding-top: 10px; }
            .signature-text { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; }
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
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div class="header-badge">Orden en Reparación</div>
            <h1 class="page-title">Orden #${order.id.slice(0, 8).toUpperCase()}</h1>
            <div class="page-subtitle">Generado el ${new Date().toLocaleString()}</div>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title">Detalles del Cliente</div>
              <div class="card-content">
                <h3>${order.customer?.name || order.customerName || 'Cliente General'}</h3>
                ${order.customer?.email ? `<p>${order.customer.email}</p>` : ''}
                ${order.customer?.address ? `<p>${order.customer.address || ''}</p>` : ''}
                ${order.customer?.phone ? `<p>${order.customer.phone}</p>` : ''}
              </div>
            </div>
            
            <div class="card">
              <div class="card-title">Técnico de Servicio</div>
              <div class="card-content">
                <h3>${order.technician ? `${order.technician.firstName} ${order.technician.lastName}` : 'No Asignado'}</h3>
                ${order.technician?.email ? `<p>${order.technician.email}</p>` : ''}
                <p>Nivel: Técnico Certificado</p>
              </div>
            </div>
          </div>

          <div class="table-section">
            <h2 class="table-title">Equipos Registrados</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 40%">Marca y Modelo</th>
                  <th style="width: 20%">N° de Serie</th>
                  <th style="width: 25%">Problema/Accesorios</th>
                  <th style="width: 15%; text-align: right">Cargo</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: #111827;">${item.deviceType || 'Equipo'} - ${item.brand}</div>
                      <div style="color: #6B7280;">Modelo: ${item.model}</div>
                    </td>
                    <td style="font-family: monospace; color: #4B5563;">${item.serialNumber || 'N/A'}</td>
                    <td>
                      <div style="margin-bottom: 5px;">${item.problemDescription}</div>
                      <!-- Si hubiera accesorios se mostrarían aquí, por ahora mockeamos -->
                      <span class="badge-acc">✓ Cargador</span>
                    </td>
                    <td class="price-col">S/ ${(order.initialReviewCost || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer-grid">
            <div class="terms-box">
              <div class="terms-title">Términos y Condiciones</div>
              <div class="terms-text">
                ${termsRequest}
              </div>
            </div>

            <div class="summary-box">
              <div class="summary-title">Resumen Total</div>
              <div class="summary-row">
                <span>Revisión Inicial</span>
                <span>S/ ${(order.initialReviewCost || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Impuestos Estimados (0%)</span>
                <span>S/ 0.00</span>
              </div>
              <div class="total-row">
                <span>Total General</span>
                <span>S/ ${(order.totalCost || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-line">
              <div class="signature-text">Firma del Cliente</div>
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
