import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LabelScanner from './LabelScanner';
import type { ScannedFields } from '../services/labelOcr';

export type { ScannedFields } from '../services/labelOcr';

interface ScanLabelButtonProps {
  onScanned: (fields: ScannedFields) => void;
}

export default function ScanLabelButton({ onScanned }: ScanLabelButtonProps) {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setShowScanner(true)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="barcode-scan" size={18} color="#3B82F6" />
        <Text style={styles.scanText}>Escanear etiqueta</Text>
      </TouchableOpacity>
      <LabelScanner
        visible={showScanner}
        onApply={(fields) => {
          setShowScanner(false);
          onScanned(fields);
        }}
        onClose={() => setShowScanner(false)}
      />
    </View>
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
