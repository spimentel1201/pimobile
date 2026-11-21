import QRCode from 'qrcode';
import * as Print from 'expo-print';

/**
 * Payload que se codifica en el QR de la etiqueta del artefacto.
 * - Si hay serial: "serial:<serial>" → al escanear se resuelve a la última
 *   orden registrada para ese serial.
 * - Si no hay serial: "order:<id>" → abre directamente esa orden.
 */
export const buildQrPayload = (serial?: string | null, orderId?: string): string => {
  const s = (serial || '').trim();
  if (s) return `serial:${s}`;
  return `order:${orderId || ''}`;
};

/** Genera el SVG del QR (string) para incrustar en HTML de impresión. */
export const buildQrSvg = async (payload: string): Promise<string> => {
  try {
    return await QRCode.toString(payload, { type: 'svg', width: 220, margin: 1 });
  } catch {
    return '';
  }
};

/** Imprime una etiqueta con el QR + datos del artefacto/cliente/orden. */
export const printQrLabel = async (params: {
  payload: string;
  title: string;
  subtitle?: string;
  serial?: string | null;
  customer?: string | null;
  device?: string | null;
}): Promise<void> => {
  const svg = await buildQrSvg(params.payload);
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, sans-serif; padding: 24px; text-align: center; }
          h1 { font-size: 18px; margin: 0 0 4px; }
          .sub { font-size: 12px; color: #555; margin: 0 0 12px; }
          .qr { margin: 12px auto; }
          .row { font-size: 13px; margin: 4px 0; text-align: left; }
          .label { font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>${params.title}</h1>
        ${params.subtitle ? `<p class="sub">${params.subtitle}</p>` : ''}
        <div class="qr">${svg}</div>
        ${params.serial ? `<p class="row"><span class="label">S/N:</span> ${params.serial}</p>` : ''}
        ${params.customer ? `<p class="row"><span class="label">Cliente:</span> ${params.customer}</p>` : ''}
        ${params.device ? `<p class="row"><span class="label">Equipo:</span> ${params.device}</p>` : ''}
        <p class="sub">Escanea el QR para ver el detalle de la orden</p>
      </body>
    </html>
  `;
  await Print.printAsync({ html });
};