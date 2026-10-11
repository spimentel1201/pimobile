import * as FileSystem from 'expo-file-system';
import type { ParsedLabel } from '../utils/labelParser';

// Optional backend endpoint that forwards the label photo + OCR text to
// Gemini (server holds the API key — never ship it in the app).
// Configure with EXPO_PUBLIC_LABEL_AI_URL. When unset, AI enhance is hidden.
//
// Expected backend contract:
//   POST { imageBase64, mimeType, ocrText }
//   -> { deviceType, brand, model, serialNumber }
export interface LabelAiResult {
  deviceType?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
}

export function isLabelAiConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_LABEL_AI_URL;
}

export async function enhanceLabelWithAi(
  imageUri: string,
  ocrText: string,
): Promise<LabelAiResult> {
  const url = process.env.EXPO_PUBLIC_LABEL_AI_URL;
  if (!url) throw new Error('IA no configurada');

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg', ocrText }),
  });

  if (!response.ok) {
    throw new Error('No se pudo mejorar con IA');
  }

  const data = (await response.json()) as LabelAiResult & { parsed?: ParsedLabel };
  const src = data.parsed ?? data;
  return {
    deviceType: String(src.deviceType ?? '').toUpperCase(),
    brand: String(src.brand ?? '').toUpperCase(),
    model: String(src.model ?? '').toUpperCase(),
    serialNumber: String(src.serialNumber ?? '').toUpperCase(),
  };
}
