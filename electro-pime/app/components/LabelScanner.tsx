import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { extractDeviceInfoFromImage, ExtractedDeviceInfo } from '../services/ocrService';

interface LabelScannerProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (data: ExtractedDeviceInfo) => void;
}

export default function LabelScanner({ visible, onClose, onConfirm }: LabelScannerProps) {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedDeviceInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setImageUri(null);
        setExtractedData(null);
        setError(null);
        setLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para escanear etiquetas.');
                return false;
            }
        }
        return true;
    };

    const takePhoto = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            processImage(result.assets[0].uri);
        }
    };

    const pickFromGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            processImage(result.assets[0].uri);
        }
    };

    const processImage = async (uri: string) => {
        setImageUri(uri);
        setLoading(true);
        setError(null);
        setExtractedData(null);

        try {
            const data = await extractDeviceInfoFromImage(uri);
            setExtractedData(data);

            if (!data.brand && !data.model && !data.serialNumber) {
                setError('No se pudo detectar información en la imagen. Intente con otra foto.');
            }
        } catch (err: any) {
            console.error('OCR Error:', err);
            setError(err.message || 'Error al procesar la imagen');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (extractedData) {
            onConfirm(extractedData);
            handleClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Escanear Etiqueta</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {!imageUri ? (
                        // Initial state - show capture buttons
                        <View style={styles.captureSection}>
                            <MaterialCommunityIcons name="camera-iris" size={80} color="#D1D5DB" />
                            <Text style={styles.instructionText}>
                                Tome una foto de la etiqueta del dispositivo
                            </Text>
                            <Text style={styles.subText}>
                                Busque la etiqueta con la marca, modelo y número de serie
                            </Text>

                            <View style={styles.buttonGroup}>
                                <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                                    <MaterialCommunityIcons name="camera" size={28} color="white" />
                                    <Text style={styles.captureButtonText}>Tomar Foto</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
                                    <MaterialCommunityIcons name="image" size={28} color="#3B82F6" />
                                    <Text style={styles.galleryButtonText}>Galería</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        // Image captured - show preview and results
                        <View style={styles.resultSection}>
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#3B82F6" />
                                    <Text style={styles.loadingText}>Analizando etiqueta...</Text>
                                </View>
                            ) : error ? (
                                <View style={styles.errorContainer}>
                                    <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                    <TouchableOpacity style={styles.retryButton} onPress={resetState}>
                                        <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : extractedData ? (
                                <View style={styles.dataContainer}>
                                    <Text style={styles.dataTitle}>Datos detectados:</Text>

                                    <View style={styles.dataRow}>
                                        <Text style={styles.dataLabel}>Marca:</Text>
                                        <Text style={[styles.dataValue, !extractedData.brand && styles.notFound]}>
                                            {extractedData.brand || 'No detectado'}
                                        </Text>
                                    </View>

                                    <View style={styles.dataRow}>
                                        <Text style={styles.dataLabel}>Modelo:</Text>
                                        <Text style={[styles.dataValue, !extractedData.model && styles.notFound]}>
                                            {extractedData.model || 'No detectado'}
                                        </Text>
                                    </View>

                                    <View style={styles.dataRow}>
                                        <Text style={styles.dataLabel}>N° Serie:</Text>
                                        <Text style={[styles.dataValue, !extractedData.serialNumber && styles.notFound]}>
                                            {extractedData.serialNumber || 'No detectado'}
                                        </Text>
                                    </View>

                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity style={styles.retakeButton} onPress={resetState}>
                                            <MaterialCommunityIcons name="camera-retake" size={20} color="#6B7280" />
                                            <Text style={styles.retakeButtonText}>Otra foto</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.confirmButton,
                                                (!extractedData.brand && !extractedData.model && !extractedData.serialNumber) && styles.confirmButtonDisabled
                                            ]}
                                            onPress={handleConfirm}
                                            disabled={!extractedData.brand && !extractedData.model && !extractedData.serialNumber}
                                        >
                                            <MaterialCommunityIcons name="check" size={20} color="white" />
                                            <Text style={styles.confirmButtonText}>Usar datos</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    captureSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginTop: 24,
    },
    subText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 32,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 32,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    captureButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    galleryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    galleryButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '600',
    },
    resultSection: {
        flex: 1,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 32,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        alignItems: 'center',
        marginTop: 32,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#DC2626',
        fontWeight: '600',
    },
    dataContainer: {
        marginTop: 24,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dataTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dataLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    dataValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    notFound: {
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    retakeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
    },
    retakeButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#10B981',
    },
    confirmButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
