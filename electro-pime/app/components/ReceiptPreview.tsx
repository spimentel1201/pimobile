import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RepairOrder } from '../types/api';
import {
  fetchOrderReceiptData,
  generateOrderReceiptHTML,
  printReceiptHTML,
} from '../utils/orderReceipt';
import { colors, radii, shadow, spacing, typography } from '../theme';

// react-native-webview no publica build web (solo `requireNativeComponent`), así
// que se exige perezosamente y solo fuera de web. En web se usa un <iframe>.
const WebView: any =
  Platform.OS === 'web'
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('react-native-webview').default;

/** Elemento DOM `iframe`, válido solo en react-native-web. */
const Iframe: any = Platform.OS === 'web' ? 'iframe' : null;

type PreviewStatus = 'loading' | 'ready' | 'error';

interface ReceiptPreviewProps {
  visible: boolean;
  /** Orden a previsualizar. Al ocultarse se limpia el estado interno. */
  order: RepairOrder | null;
  onClose: () => void;
}

/**
 * Vista previa del recibo antes de imprimir.
 *
 * Carga la orden fresca (`billing` solo viene de GET /repair-orders/:id) y sus
 * presupuestos, genera el HTML con `generateOrderReceiptHTML` y lo renderiza
 * dentro de la hoja: en web con un <iframe srcdoc>, en nativo con WebView.
 * El HTML que se ve es exactamente el mismo que manda a imprimir.
 */
export default function ReceiptPreview({ visible, order, onClose }: ReceiptPreviewProps) {
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const [html, setHtml] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const ref = order?.id ? `#${order.id.slice(0, 8).toUpperCase()}` : '';

  useEffect(() => {
    if (!visible || !order) return;

    let cancelled = false;
    setStatus('loading');
    setHtml(null);
    setPrintError(null);

    fetchOrderReceiptData(order)
      .then((data) => {
        if (cancelled) return;
        setHtml(generateOrderReceiptHTML(data.order, data.quotes));
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Error building receipt preview:', error);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [visible, order, retryToken]);

  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  const handlePrint = useCallback(async () => {
    if (!html) return;
    setPrinting(true);
    setPrintError(null);
    try {
      await printReceiptHTML(html);
    } catch (error) {
      console.error('Error printing receipt:', error);
      // Sin Alert.alert: no está implementado en react-native-web.
      setPrintError('No se pudo abrir la impresión. Intenta de nuevo.');
    } finally {
      setPrinting(false);
    }
  }, [html]);

  const handleClose = useCallback(() => {
    if (printing) return;
    onClose();
  }, [onClose, printing]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="printer-outline" size={20} color={colors.violet} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                Vista previa del recibo
              </Text>
              {!!ref && <Text style={styles.subtitle}>{ref}</Text>}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Cerrar vista previa"
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Hoja con el HTML renderizado */}
          <View style={styles.paper}>
            {status === 'loading' && (
              <View style={styles.stateBlock}>
                <ActivityIndicator size="large" color={colors.violet} />
                <Text style={styles.stateText}>Generando recibo…</Text>
              </View>
            )}

            {status === 'error' && (
              <View style={styles.stateBlock}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={40}
                  color={colors.danger}
                />
                <Text style={styles.stateText}>No se pudo generar el recibo</Text>
                <Text style={styles.stateHint}>
                  Revisa tu conexión e inténtalo otra vez.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={retry}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="refresh" size={16} color={colors.primary} />
                  <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            )}

            {status === 'ready' &&
              (Platform.OS === 'web' ? (
                <Iframe
                  srcDoc={html ?? ''}
                  title="Recibo de la orden"
                  style={styles.frame}
                />
              ) : (
                <WebView
                  source={{ html: html ?? '' }}
                  style={styles.frame}
                  originWhitelist={['*']}
                  showsVerticalScrollIndicator
                />
              ))}
          </View>

          {/* Pie de acciones */}
          <View style={styles.footer}>
            {!!printError && (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.danger} />
                <Text style={styles.errorText}>{printError}</Text>
              </View>
            )}
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.85}
                disabled={printing}
              >
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.printButton, printing && styles.printButtonDisabled]}
                onPress={handlePrint}
                activeOpacity={0.85}
                disabled={printing || status !== 'ready'}
                accessibilityLabel="Imprimir recibo"
              >
                <MaterialCommunityIcons name="printer" size={18} color={colors.white} />
                <Text style={styles.printText}>{printing ? 'Abriendo…' : 'Imprimir'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '92%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    overflow: 'hidden',
    ...shadow,
    elevation: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.violetSoft,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.title,
    fontSize: 17,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },

  // Hoja A4 simulada: el HTML dentro es el mismo que se imprime.
  paper: {
    flex: 1,
    minHeight: 340,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  frame: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stateBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  stateText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  stateHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
    backgroundColor: colors.primarySoft,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  printButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: radii.button,
    backgroundColor: colors.violet,
  },
  printButtonDisabled: {
    opacity: 0.6,
  },
  printText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});
