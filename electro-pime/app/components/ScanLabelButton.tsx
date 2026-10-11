import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { parseLabelText, type ParsedLabel } from '../utils/labelParser';
import { enhanceLabelWithAi, isLabelAiConfigured } from '../services/labelAi';

export interface ScannedFields {
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
}

interface ScanLabelButtonProps {
  onScanned: (fields: ScannedFields) => void;
}

export default function ScanLabelButton({ onScanned }: ScanLabelButtonProps) {
  const [loading, setLoading] = useState(false);

  const applyFields = (parsed: ParsedLabel) => {
    onScanned({
      deviceType: parsed.deviceType,
      brand: parsed.brand,
      model: parsed.model,
      serialNumber: parsed.serialNumber,
    });
  };

  const handleEnhance = async (imageUri: string, ocrText: string) => {
    setLoading(true);
    try {
      const improved = await enhanceLabelWithAi(imageUri, ocrText);
      onScanned({
        deviceType: improved.deviceType ?? '',
        brand: improved.brand ?? '',
        model: improved.model ?? '',
        serialNumber: improved.serialNumber ?? '',
      });
      Alert.alert('Listo', 'Datos mejorados con IA. Verifica y edita si hace falta.');
    } catch {
      Alert.alert('Aviso', 'No se pudo mejorar con IA. Usa los datos detectados.');
    } finally {
      setLoading(false);
    }
  };

  const showResult = (parsed: ParsedLabel, imageUri: string) => {
    const found = [
      parsed.brand ? `Marca: ${parsed.brand}` : null,
      parsed.model ? `Modelo: ${parsed.model}` : null,
      parsed.serialNumber ? `Serie: ${parsed.serialNumber}` : null,
      parsed.deviceType ? `Tipo: ${parsed.deviceType}` : null,
    ].filter(Boolean);

    const message =
      found.length > 0
        ? `${found.join('\n')}\n\nVerifica y edita si hace falta.`
        : 'No se detectó texto útil. Reintenta con mejor luz y encuadre.';

    const buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'default' }> = [
      { text: 'OK' },
    ];
    if (isLabelAiConfigured() && parsed.confidence !== 'high') {
      buttons.unshift({
        text: 'Mejorar con IA',
        onPress: () => handleEnhance(imageUri, parsed.rawText),
      });
    }

    Alert.alert('Etiqueta escaneada', message, buttons);
  };

  const recognizeOnWeb = async (uri: string): Promise<string> => {
    // require instead of dynamic import (tsconfig target). Only runs on web.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createWorker } = require('tesseract.js');
    const worker = await createWorker('eng');
    try {
      const { data } = await worker.recognize(uri);
      return data?.text ?? '';
    } finally {
      await worker.terminate();
    }
  };

  const handleScanWeb = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const uri = result.assets[0].uri;
    setLoading(true);
    try {
      const text = await recognizeOnWeb(uri);
      const parsed = parseLabelText(text);
      applyFields(parsed);
      showResult(parsed, uri);
    } catch {
      Alert.alert('Error', 'No se pudo leer la imagen. Reintenta con una foto más nítida.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (Platform.OS === 'web') {
      await handleScanWeb();
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso', 'Activa el permiso de cámara para escanear etiquetas.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const uri = result.assets[0].uri;
    setLoading(true);
    try {
      // Dynamic require: expo-mlkit-ocr is native-only (no Expo Go / web).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { recognizeText } = require('expo-mlkit-ocr');
      const ocr = await recognizeText(uri);
      const parsed = parseLabelText(ocr?.text ?? '');
      applyFields(parsed);
      showResult(parsed, uri);
    } catch {
      Alert.alert(
        'No disponible',
        'El OCR necesita un dev build (EAS). Expo Go no incluye el módulo nativo.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.scanButton}
      onPress={handleScan}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#3B82F6" />
      ) : (
        <MaterialCommunityIcons name="barcode-scan" size={18} color="#3B82F6" />
      )}
      <Text style={styles.scanText}>
        {loading ? 'Leyendo etiqueta...' : 'Escanear etiqueta'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  scanText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});
