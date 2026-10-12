import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../theme';
import {
  recognizeLabel,
  isCloudOcrConfigured,
  emptyFields,
  countDetectedFields,
  type OcrEngine,
  type ScannedFields,
} from '../services/labelOcr';

type Step = 'choose' | 'camera' | 'preview' | 'result';

interface LabelScannerProps {
  visible: boolean;
  onApply: (fields: ScannedFields) => void;
  onClose: () => void;
}

const ENGINE_HELP: Record<OcrEngine, string> = {
  local: 'OCR local — funciona sin internet. Ideal para etiquetas claras.',
  cloud: 'OCR en la nube (Gemini) — más preciso en etiquetas dañadas. Requiere internet.',
};

const FIELD_DEFS: Array<{ key: keyof ScannedFields; label: string; placeholder: string }> = [
  { key: 'deviceType', label: 'Tipo', placeholder: 'Ej. Laptop, TV LED...' },
  { key: 'brand', label: 'Marca', placeholder: 'Ej. SAMSUNG, LG...' },
  { key: 'model', label: 'Modelo', placeholder: 'Ej. 55TU7000...' },
  { key: 'serialNumber', label: 'N° de serie', placeholder: 'Ej. S/N...' },
];

export default function LabelScanner({ visible, onApply, onClose }: LabelScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<Step>('choose');
  const [engine, setEngine] = useState<OcrEngine>('local');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fields, setFields] = useState<ScannedFields>(emptyFields());
  const [fellBack, setFellBack] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const cloudReady = isCloudOcrConfigured();

  useEffect(() => {
    if (visible) {
      setStep('choose');
      setImageUri(null);
      setFields(emptyFields());
      setFellBack(false);
      setScanning(false);
      setStatus('');
      setProgress(0);
      setError(null);
      setTorch(false);
    }
  }, [visible]);

  const pickImage = async (fromCamera: boolean) => {
    setError(null);
    try {
      const launcher = fromCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const result = await launcher({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setImageUri(result.assets[0].uri);
      setStep('preview');
    } catch {
      setError('No se pudo obtener la imagen. Reintenta.');
    }
  };

  const openCamera = async () => {
    // Live viewfinder is native-only; on web fall back to the system picker.
    if (Platform.OS === 'web') {
      await pickImage(true);
      return;
    }
    setError(null);
    let granted = permission?.granted ?? false;
    if (!granted) {
      const res = await requestPermission();
      granted = res.granted;
    }
    if (!granted) {
      setError('Activa el permiso de cámara para escanear etiquetas.');
      return;
    }
    setStep('camera');
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        exif: false,
        skipProcessing: true,
      });
      if (!photo?.uri) {
        setError('No se pudo capturar. Reintenta.');
        return;
      }
      setTorch(false);
      setImageUri(photo.uri);
      setStep('preview');
    } catch {
      setError('No se pudo capturar. Reintenta con mejor luz.');
    }
  };

  const handleScan = async () => {
    if (!imageUri || scanning) return;
    setScanning(true);
    setError(null);
    setFellBack(false);
    setStatus('Iniciando...');
    setProgress(0);
    try {
      const res = await recognizeLabel(imageUri, engine, (p) => {
        setStatus(p.status);
        setProgress(p.progress);
      });
      setFields(res.fields);
      setFellBack(res.fellBackToLocal);
      setStep('result');
    } catch {
      setError('No se pudo leer la imagen. Reintenta con mejor luz y encuadre.');
    } finally {
      setScanning(false);
    }
  };

  const detectedCount = countDetectedFields(fields);

  const renderEngineToggle = () => (
    <View>
      <View style={styles.engineRow}>
        <TouchableOpacity
          style={[styles.engineButton, engine === 'local' && styles.engineButtonActive]}
          onPress={() => setEngine('local')}
          activeOpacity={0.7}
        >
          <Text style={[styles.engineText, engine === 'local' && styles.engineTextActive]}>
            Local
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.engineButton,
            engine === 'cloud' && styles.engineButtonActive,
            !cloudReady && styles.engineButtonDisabled,
          ]}
          onPress={() => cloudReady && setEngine('cloud')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.engineText,
              engine === 'cloud' && styles.engineTextActive,
              !cloudReady && styles.engineTextDisabled,
            ]}
          >
            Nube (Gemini)
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.helpText}>{ENGINE_HELP[engine]}</Text>
      {!cloudReady && (
        <Text style={styles.helpText}>Nube no configurada: falta EXPO_PUBLIC_LABEL_AI_URL.</Text>
      )}
    </View>
  );

  const renderChoose = () => (
    <View style={styles.section}>
      {renderEngineToggle()}
      <View style={styles.chooseRow}>
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.chooseButton} onPress={openCamera} activeOpacity={0.7}>
            <MaterialCommunityIcons name="camera" size={26} color={colors.primary} />
            <Text style={styles.chooseText}>Cámara</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.chooseButton} onPress={() => pickImage(false)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="image-plus" size={26} color={colors.primary} />
          <Text style={styles.chooseText}>Subir imagen</Text>
        </TouchableOpacity>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.chooseButton} onPress={() => pickImage(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="camera" size={26} color={colors.primary} />
            <Text style={styles.chooseText}>Tomar foto</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCamera = () => (
    <View style={styles.section}>
      <View style={styles.viewfinder}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          autofocus="on"
          enableTorch={torch}
        />
        <View style={styles.frame} pointerEvents="none" />
      </View>
      <Text style={styles.helpText}>Encuadra la etiqueta dentro del marco y captura.</Text>
      <View style={styles.cameraRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setTorch((t) => !t)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={torch ? 'flashlight' : 'flashlight-off'}
            size={22}
            color={torch ? colors.warning : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={capturePhoto} activeOpacity={0.8}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="camera-switch" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setStep('choose')} activeOpacity={0.7}>
        <Text style={styles.linkText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.section}>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.primaryButton, scanning && styles.buttonDisabled]}
          onPress={handleScan}
          disabled={scanning}
          activeOpacity={0.85}
        >
          {scanning ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="barcode-scan" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>Escanear etiqueta</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setStep(Platform.OS === 'web' ? 'choose' : 'camera')}
          disabled={scanning}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Repetir</Text>
        </TouchableOpacity>
      </View>
      {scanning && (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.helpText}>{status}</Text>
        </View>
      )}
    </View>
  );

  const renderResult = () => (
    <View style={styles.section}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>Campos detectados</Text>
        <Text style={[styles.resultCount, detectedCount > 0 && styles.resultCountOk]}>
          {detectedCount} campos
        </Text>
      </View>
      {fellBack && (
        <Text style={styles.helpText}>Sin conexión a la nube: se usó OCR local.</Text>
      )}
      {FIELD_DEFS.map((f) => (
        <View key={f.key} style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{f.label}</Text>
          <TextInput
            style={styles.fieldInput}
            value={fields[f.key]}
            onChangeText={(v) => setFields((prev) => ({ ...prev, [f.key]: v.toUpperCase() }))}
            placeholder={f.placeholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
      ))}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.primaryButton, detectedCount === 0 && styles.buttonDisabled]}
          onPress={() => onApply(fields)}
          disabled={detectedCount === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Aplicar al formulario</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>Descartar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Escanear etiqueta</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {step === 'choose' && renderChoose()}
          {step === 'camera' && renderCamera()}
          {step === 'preview' && renderPreview()}
          {step === 'result' && renderResult()}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.title,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  engineRow: {
    flexDirection: 'row',
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  engineButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  engineButtonActive: {
    backgroundColor: colors.primary,
  },
  engineButtonDisabled: {
    opacity: 0.5,
  },
  engineText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  engineTextActive: {
    color: colors.white,
  },
  engineTextDisabled: {
    color: colors.textMuted,
  },
  helpText: {
    ...typography.caption,
    textAlign: 'center',
  },
  chooseRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chooseButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  chooseText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  viewfinder: {
    height: 320,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  frame: {
    position: 'absolute',
    top: '18%',
    left: '11%',
    right: '11%',
    bottom: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.button,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  iconButton: {
    padding: spacing.md,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
  },
  linkText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceMuted,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  progressBlock: {
    gap: spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    ...typography.title,
    fontSize: 16,
  },
  resultCount: {
    ...typography.caption,
    fontFamily: 'monospace',
  },
  resultCountOk: {
    color: colors.success,
    fontWeight: '600',
  },
  fieldRow: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  fieldInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  errorBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.button,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
});
