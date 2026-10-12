export interface ParsedLabel {
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
}

const DEVICE_TYPES = [
  'Laptop', 'TV LED', 'TV LCD', 'Control Remoto', 'Equipo de sonido',
  'Equipo Portátil', 'DVD', 'Licuadora', 'Olla arrocera', 'Horno Microondas',
  'Radio', 'Consola', 'Ventilador', 'PC de Escritorio', 'Celular', 'Tablet',
  'Monitor', 'Impresora', 'Otro',
];

// Keywords found on labels mapped to DEVICE_TYPES entries.
const DEVICE_KEYWORDS: Array<{ keywords: string[]; type: string }> = [
  { keywords: ['TV LED', 'LED TV', 'SMART TV LED'], type: 'TV LED' },
  { keywords: ['TV LCD', 'LCD TV'], type: 'TV LCD' },
  { keywords: ['TELEVISOR', 'TELEVISION', 'TV'], type: 'TV LED' },
  { keywords: ['LAPTOP', 'NOTEBOOK', 'PORTATIL'], type: 'Laptop' },
  { keywords: ['CELULAR', 'SMARTPHONE', 'MOBILE PHONE', 'TELEFONO'], type: 'Celular' },
  { keywords: ['TABLET'], type: 'Tablet' },
  { keywords: ['MONITOR'], type: 'Monitor' },
  { keywords: ['IMPRESORA', 'PRINTER'], type: 'Impresora' },
  { keywords: ['LICUADORA', 'BLENDER'], type: 'Licuadora' },
  { keywords: ['MICROONDAS', 'MICROWAVE'], type: 'Horno Microondas' },
  { keywords: ['OLLA ARROCERA', 'RICE COOKER'], type: 'Olla arrocera' },
  { keywords: ['VENTILADOR', 'FAN'], type: 'Ventilador' },
  { keywords: ['CONSOLA', 'CONSOLE', 'PLAYSTATION', 'XBOX', 'NINTENDO'], type: 'Consola' },
  { keywords: ['RADIO'], type: 'Radio' },
  { keywords: ['DVD', 'BLU-RAY', 'BLURAY'], type: 'DVD' },
  { keywords: ['EQUIPO DE SONIDO', 'SOUND SYSTEM', 'PARLANTE', 'SPEAKER', 'AUDIO'], type: 'Equipo de sonido' },
  { keywords: ['CONTROL REMOTO', 'REMOTE CONTROL', 'REMOTE'], type: 'Control Remoto' },
  { keywords: ['PC', 'DESKTOP', 'COMPUTADORA'], type: 'PC de Escritorio' },
];

const KNOWN_BRANDS = [
  'SAMSUNG', 'LG', 'SONY', 'PANASONIC', 'PHILIPS', 'TCL', 'HISENSE',
  'APPLE', 'HUAWEI', 'XIAOMI', 'MOTOROLA', 'LENOVO', 'HP', 'DELL',
  'ASUS', 'ACER', 'TOSHIBA', 'SHARP', 'DAEWOO', 'MABE', 'OSTER',
  'ELECTROLUX', 'BOSCH', 'INDURAMA', 'RECORD', 'IMACO',
];

// `[:.\-]*` (no `?`): etiquetas Samsung usan "No.:" — un solo `?` consume "." y el ":" posterior rompe el capture.
// Dos pasadas: MODEL/MOD tienen prioridad; TIPO/TYPE/REF solo se usan si no hay línea MODEL
// (evita que "TIPO: REFRIGERADOR" contamine el modelo cuando existe "MODELO: XXX").
const MODEL_PRIMARY = [
  /\b(?:MODEL(?:O)?|MOD)\b(?:\s*\([^)]{0,20}\))?(?:\s*N[O°.]?)?\s*[:.\-]*\s*([A-Z0-9][A-Z0-9\-\/\. ]{1,30})/i,
];

const MODEL_FALLBACK = [
  /\b(?:TIPO|TYPE|REF)\b(?:\s*\([^)]{0,20}\))?(?:\s*N[O°.]?)?\s*[:.\-]*\s*([A-Z0-9][A-Z0-9\-\/\. ]{1,30})/i,
];

const SERIAL_PATTERNS = [
  // `\bNS\b`: "Contains" contiene "ns" — sin boundaries daba falso positivo tipo "TX FCC ID".
  /(?:S\/?N\.?|N[OUÚ]?[\.°]?\s*S[EÉ]RIE|SERIAL(?:\.?\s*N[O°.]?)?|SER\.?\s*N[O°.]?|N[UÚ]MERO\s+DE\s+SERIE|S[EÉ]RIE|\bNS\b)\s*(?:N[°ºO]?\.?\s*)?[:#.\-]*\s*([A-Z0-9][A-Z0-9\-\/\. ]{3,30})/i,
];

// Palabras que no deben devolverse como modelo/serie aunque el regex enganche
// (ej. "Model Code:" → "CODE", "Model / MODELE NO:" → "MODELE NO").
const FIELD_JUNK = new Set([
  'CODE', 'CODIGO', 'NO', 'N', 'NUMBER', 'NUM', 'NUMERO', 'VERSION', 'VER',
  'TYPE', 'TYPES', 'MODEL', 'MODELS', 'MODELO', 'MODELOS', 'TIPO', 'REF',
  'SERIE', 'SERIAL', 'S/N', 'SN', 'POWER', 'ENERGIA', 'ENERGY',
  // Nombres de dispositivo que no deben devolverse como modelo (ej. "TIPO: REFRIGERADOR" sin línea MODELO).
  'REFRIGERADOR', 'REFRIGERADORES', 'NEVERA', 'CONGELADOR', 'LAVADORA', 'SECADORA',
  'MICROONDAS', 'HORNO', 'LICUADORA', 'VENTILADOR', 'RADIO', 'MONITOR', 'IMPRESORA',
  'CELULAR', 'TABLET', 'LAPTOP', 'NOTEBOOK', 'CONSOLA', 'DVD', 'BLURAY', 'BLU-RAY',
  'SOUND', 'SONIDO', 'AUDIO', 'PARLANTE', 'SPEAKER', 'CONTROL', 'REMOTO', 'TELEVISOR',
  'TELEVISION', 'SMARTPHONE', 'COMPUTADORA', 'DESKTOP', 'PC', 'TV', 'LED', 'LCD',
]);

function cleanToken(value: string): string {
  return value.replace(/[^A-Z0-9\-\/\. ]/gi, ' ').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, 40);
}

function detectDeviceType(text: string): string {
  const upper = text.toUpperCase();
  for (const entry of DEVICE_KEYWORDS) {
    if (entry.keywords.some((k) => upper.includes(k))) {
      if (DEVICE_TYPES.includes(entry.type)) return entry.type;
    }
  }
  return '';
}

function detectBrand(lines: string[]): string {
  for (const line of lines) {
    const upper = line.toUpperCase();
    for (const brand of KNOWN_BRANDS) {
      if (upper === brand || upper.startsWith(brand + ' ') || upper.endsWith(' ' + brand) || upper.includes(' ' + brand + ' ')) {
        return brand;
      }
    }
  }
  for (const line of lines) {
    const upper = line.toUpperCase();
    for (const brand of KNOWN_BRANDS) {
      if (upper.includes(brand)) return brand;
    }
  }
  return '';
}

function matchFirst(patterns: RegExp[], lines: string[], exclude?: string): string {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match?.[1]) {
        // Trailing " - XX" variants (ej. "55LA8600 - SA") se cortan.
        const cleaned = cleanToken(match[1]).split(' - ')[0].trim();
        if (cleaned && !FIELD_JUNK.has(cleaned) && cleaned !== exclude && cleaned.length >= 2) return cleaned;
      }
    }
  }
  return '';
}

export function parseLabelText(rawText: string): ParsedLabel {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const deviceType = detectDeviceType(rawText);
  const brand = detectBrand(lines);
  const model =
    matchFirst(MODEL_PRIMARY, lines, brand) || matchFirst(MODEL_FALLBACK, lines, brand);
  const serialNumber = matchFirst(SERIAL_PATTERNS, lines);

  const hits = [deviceType, brand, model, serialNumber].filter((v) => v).length;
  const confidence: ParsedLabel['confidence'] =
    hits >= 3 ? 'high' : hits === 2 ? 'medium' : 'low';

  return { deviceType, brand, model, serialNumber, confidence, rawText };
}
