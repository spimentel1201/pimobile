import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from './api';
import { secureStorage } from '../utils/storage';
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

// Gemini downsamplea/tilea fotos a resolución completa de cámara y la
// etiqueta termina ilegible. Paridad con mantenimiento360 (800px / 0.8);
// 1280 para preservar seriales pequeños de electrónica.
const AI_MAX_WIDTH = 1280;
const AI_JPEG_QUALITY = 0.8;

async function prepareImageForAi(imageUri: string): Promise<{
  base64: string;
  mimeType: string;
}> {
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: AI_MAX_WIDTH } }],
    { compress: AI_JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { base64, mimeType: 'image/jpeg' };
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

  const { base64, mimeType } = await prepareImageForAi(imageUri);

  let token = api.getToken();
  if (!token) {
    try {
      token = await secureStorage.getItem('auth_token');
    } catch {
      token = null;
    }
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageBase64: base64, mimeType, ocrText }),
  });

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch {}
    throw new Error(`OCR cloud falló (${response.status}): ${detail.slice(0, 200)}`);
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
