import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { spacing, typography, radii, shadows, colors } from '../../constants/theme';

interface SearchableSelectorProps<T> {
  label: string;
  placeholder: string;
  value: T | null;
  onSelect: (item: T | null) => void;
  searchFn: (query: string) => Promise<T[]>;
  renderItem: (item: T) => string;
  renderSubtitle?: (item: T) => string;
  keyExtractor: (item: T) => string;
  required?: boolean;
  disabled?: boolean;
  debounceMs?: number;
}

export default function SearchableSelector<T>({
  label,
  placeholder,
  value,
  onSelect,
  searchFn,
  renderItem,
  renderSubtitle,
  keyExtractor,
  required = false,
  disabled = false,
  debounceMs = 300,
}: SearchableSelectorProps<T>) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!modalVisible) return;

    const timeoutId = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        setError(null);
        try {
          const data = await searchFn(searchQuery);
          setResults(data);
        } catch (err: any) {
          setError(err.message || 'Error al buscar');
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else if (searchQuery.length === 0) {
        // Load all items when query is empty
        setLoading(true);
        try {
          const data = await searchFn('');
          setResults(data);
        } catch (err: any) {
          setError(err.message || 'Error al cargar datos');
          setResults([]);
        } finally {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, modalVisible, searchFn, debounceMs]);

  const handleOpen = () => {
    if (disabled) return;
    setModalVisible(true);
    setSearchQuery('');
    setResults([]);
    setError(null);
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setModalVisible(false);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    onSelect(null);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>

      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: theme.inputBg, borderColor: theme.border },
          disabled && styles.selectorDisabled,
        ]}
        onPress={handleOpen}
        disabled={disabled}
      >
        {value ? (
          <View style={styles.selectedContainer}>
            <View style={styles.selectedTextContainer}>
              <Text style={[styles.selectedText, { color: theme.text }]}>
                {renderItem(value)}
              </Text>
              {renderSubtitle && (
                <Text style={[styles.selectedSubtitle, { color: theme.textSecondary }]}>
                  {renderSubtitle(value)}
                </Text>
              )}
            </View>
            {!required && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: theme.textMuted }]}>
            {placeholder}
          </Text>
        )}
        <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{label}</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={
                <Ionicons name="search" size={20} color={theme.textMuted} />
              }
              rightIcon={
                searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                ) : undefined
              }
              containerStyle={styles.searchInputContainer}
            />
          </View>

          {loading ? (
            <View style={styles.centered}>
              <SkeletonLoader lines={4} lineHeight={16} borderRadius={radii.sm} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Buscando...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : results.length === 0 ? (
            <EmptyState
              icon="magnify"
              title={
                searchQuery.length < 2
                  ? 'Escribe al menos 2 caracteres para buscar'
                  : 'No se encontraron resultados'
              }
            />
          ) : (
            <FlatList
              data={results}
              keyExtractor={keyExtractor}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Card variant="outlined" padding={spacing.md}>
                    <View style={styles.resultRow}>
                      <View style={styles.resultContent}>
                        <Text style={[styles.resultText, { color: theme.text }]}>
                          {renderItem(item)}
                        </Text>
                        {renderSubtitle && (
                          <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]}>
                            {renderSubtitle(item)}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </View>
                  </Card>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 48,
    ...shadows.sm,
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  selectedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: typography.sizes.base,
  },
  selectedSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: spacing['2xs'],
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  placeholder: {
    fontSize: typography.sizes.base,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  searchWrapper: {
    padding: spacing.base,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  separator: {
    height: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultText: {
    fontSize: typography.sizes.base,
  },
  resultSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: spacing['2xs'],
  },
});
