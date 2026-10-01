/**
 * Utilidades de teléfono — fuente única de verdad para el contacto con clientes.
 *
 * Los números se guardan como dígitos locales peruanos (9 dígitos, p. ej. 987654321),
 * pero los enlaces de llamada y WhatsApp requieren formato internacional:
 *   · `tel:+51987654321`
 *   · `https://wa.me/51987654321`
 */

/** Código de país por defecto (Perú) */
export const DEFAULT_COUNTRY_CODE = '51';

/** Mensaje mostrado cuando el cliente no tiene un número válido */
export const NO_PHONE_MESSAGE = 'Este cliente no tiene un teléfono válido';

/**
 * Normaliza un teléfono a formato internacional SIN el prefijo `+`.
 * - Descarta cualquier carácter que no sea dígito.
 * - Devuelve `null` si no queda un número válido (menos de 7 dígitos).
 * - Antepone el código de país, salvo que ya venga en formato internacional
 *   (p. ej. `51 987654321`), en cuyo caso no lo duplica.
 */
export const normalizePhone = (raw?: string | null): string | null => {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length < 7) return null;
  // Ya viene con código de país: no anteponer 51 otra vez.
  if (digits.length > 9 && digits.startsWith(DEFAULT_COUNTRY_CODE)) return digits;
  return `${DEFAULT_COUNTRY_CODE}${digits}`;
};

/** Construye el enlace `tel:+51<numero>` o `null` si el número no es válido */
export const buildTelUrl = (raw?: string | null): string | null => {
  const phone = normalizePhone(raw);
  return phone ? `tel:+${phone}` : null;
};

/** Construye el enlace `https://wa.me/51<numero>` o `null` si el número no es válido */
export const buildWhatsAppUrl = (raw?: string | null): string | null => {
  const phone = normalizePhone(raw);
  return phone ? `https://wa.me/${phone}` : null;
};

/**
 * Resuelve el enlace de teléfono o WhatsApp de un cliente.
 * Devuelve `null` cuando no hay un número válido, para que la pantalla
 * muestre su propio aviso (toast) en lugar de abrir una URL rota.
 */
export const resolvePhoneLink = (
  kind: 'phone' | 'whatsapp',
  raw?: string | null
): string | null => (kind === 'phone' ? buildTelUrl(raw) : buildWhatsAppUrl(raw));