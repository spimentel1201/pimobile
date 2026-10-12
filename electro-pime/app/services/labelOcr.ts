import { Platform } from 'react-native';
import { parseLabelText, type ParsedLabel } from '../utils/labelParser';
import { enhanceLabelWithAi, isLabelAiConfigured } from './labelAi';

// Dual OCR pipeline (local + cloud), mirroring mantenimiento360:
//   Local (offline): expo-mlkit-ocr (native) / Tesseract.js eng+spa (web)
//   Nube (online):   Gemini Vision via backend (/labels/extract, key server-side)
export type OcrEngine = 'local' | 'cloud';

export interface ScannedFields {
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
}

export interface OcrProgress {
  status: string;
  progress: number; // 0-100
}

export function isCloudOcrConfigured(): boolean {
  return isLabelAiConfigured();
}

export function toScannedFields(parsed: ParsedLabel): ScannedFields {
  return {
    deviceType: parsed.deviceType,
    brand: parsed.brand,
    model: parsed.model,
    serialNumber: parsed.serialNumber,
  };
}

function emptyFields(): ScannedFields {
  return { deviceType: '', brand: '', model: '', serialNumber: '' };
}

async function recognizeLocalNative(imageUri: string): Promise<ParsedLabel> {
  // Dynamic require: expo-mlkit-ocr is native-only (no Expo Go / web).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { recognizeText } = require('expo-mlkit-ocr');
  const ocr = await recognizeText(imageUri);
  return parseLabelText(ocr?.text ?? '');
}

async function recognizeLocalWeb(
  imageUri: string,
  onProgress?: (p: OcrProgress) => void,
): Promise<ParsedLabel> {
  // require instead of dynamic import (tsconfig target). Only runs on web.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createWorker } = require('tesseract.js');
  onProgress?.({ status: 'Cargando modelos de idioma...', progress: 5 });
  const worker = await createWorker(['eng', 'spa'], undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') {
        const pct = Math.round(m.progress * 100);
        onProgress?.({ status: `Reconociendo texto... ${pct}%`, progress: pct });
      }
    },
  });
  try {
    const { data } = await worker.recognize(imageUri);
    return parseLabelText(data?.text ?? '');
  } finally {
    await worker.terminate();
  }
}

/** OCR 100% local, funciona sin internet. */
export async function recognizeLocal(
  imageUri: string,
  onProgress?: (p: OcrProgress) => void,
): Promise<ParsedLabel> {
  if (Platform.OS === 'web') {
    return recognizeLocalWeb(imageUri, onProgress);
  }
  return recognizeLocalNative(imageUri);
}

/**
 * OCR en la nube (Gemini Vision vía backend). Más preciso en etiquetas
 * dañadas o fuentes inusuales. Requiere internet + EXPO_PUBLIC_LABEL_AI_URL.
 */
export async function recognizeCloud(imageUri: string, ocrHint = ''): Promise<ScannedFields> {
  const improved = await enhanceLabelWithAi(imageUri, ocrHint);
  return {
    deviceType: improved.deviceType ?? '',
    brand: improved.brand ?? '',
    model: improved.model ?? '',
    serialNumber: improved.serialNumber ?? '',
  };
}

export interface RecognizeResult {
  fields: ScannedFields;
  usedCloud: boolean;
  fellBackToLocal: boolean;
}

/**
 * Engine-aware recognition with automatic cloud -> local fallback.
 * If the cloud engine fails (offline, no backend, 5xx), falls back to
 * local OCR so the user is never blocked.
 */
export async function recognizeLabel(
  imageUri: string,
  engine: OcrEngine,
  onProgress?: (p: OcrProgress) => void,
): Promise<RecognizeResult> {
  if (engine === 'cloud' && isCloudOcrConfigured()) {
    try {
      onProgress?.({ status: 'Enviando imagen a Gemini Vision...', progress: 30 });
      const fields = await recognizeCloud(imageUri);
      onProgress?.({ status: 'Completado', progress: 100 });
      return { fields, usedCloud: true, fellBackToLocal: false };
    } catch {
      // Fall through to local OCR.
    }
  }
  onProgress?.({ status: 'OCR local...', progress: 10 });
  const parsed = await recognizeLocal(imageUri, onProgress);
  return { fields: toScannedFields(parsed), usedCloud: false, fellBackToLocal: engine === 'cloud' };
}

export function countDetectedFields(fields: ScannedFields): number {
  return [fields.deviceType, fields.brand, fields.model, fields.serialNumber].filter(
    (v) => v && v.trim() !== '',
  ).length;
}

export { emptyFields };
