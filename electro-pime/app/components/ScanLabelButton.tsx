import { colors } from '../theme';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import LabelScanner from './LabelScanner';
import type { ScannedFields } from '../services/labelOcr';

export type { ScannedFields } from '../services/labelOcr';

interface ScanLabelButtonProps {
  onScanned: (fields: ScannedFields) => void;
}

export default function ScanLabelButton({ onScanned }: ScanLabelButtonProps) {
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [isDark]);
  const [showScanner, setShowScanner] = useState(false);

  return (
    <View>
      <TouchableOpacity activeOpacity={0.7}
        style={styles.scanButton}
        onPress={() => setShowScanner(true)}
      >
        <MaterialCommunityIcons name="barcode-scan" size={18} color={colors.primary} />
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

const createStyles = (colors: any) => StyleSheet.create({
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  scanText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
