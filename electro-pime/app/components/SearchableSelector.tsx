import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

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
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>

            <TouchableOpacity
                style={[styles.selector, disabled && styles.selectorDisabled]}
                onPress={handleOpen}
                activeOpacity={0.7}
                disabled={disabled}
            >
                {value ? (
                    <View style={styles.selectedContainer}>
                        <View style={styles.selectedTextContainer}>
                            <Text style={styles.selectedText}>{renderItem(value)}</Text>
                            {renderSubtitle && (
                                <Text style={styles.selectedSubtitle}>{renderSubtitle(value)}</Text>
                            )}
                        </View>
                        {!required && (
                            <TouchableOpacity onPress={handleClear} style={styles.clearButton} activeOpacity={0.7}>
                                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <Text style={styles.placeholder}>{placeholder}</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{label}</Text>
                        <TouchableOpacity activeOpacity={0.7}
                            onPress={() => setModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity activeOpacity={0.7} onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Buscando...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centered}>
                            <Ionicons name="alert-circle" size={48} color={colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : results.length === 0 ? (
                        <View style={styles.centered}>
                            <Ionicons name="search" size={48} color={colors.border} />
                            <Text style={styles.emptyText}>
                                {searchQuery.length < 2
                                    ? 'Escribe al menos 2 caracteres para buscar'
                                    : 'No se encontraron resultados'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={keyExtractor}
                            renderItem={({ item }) => (
                                <TouchableOpacity activeOpacity={0.7}
                                    style={styles.resultItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    <View style={styles.resultContent}>
                                        <Text style={styles.resultText}>{renderItem(item)}</Text>
                                        {renderSubtitle && (
                                            <Text style={styles.resultSubtitle}>{renderSubtitle(item)}</Text>
                                        )}
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.border} />
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
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    required: {
        color: 'colors.danger',
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'colors.border',
        borderRadius: 8,
        padding: 12,
        minHeight: 48,
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
        fontSize: 16,
        color: 'colors.textPrimary',
    },
    selectedSubtitle: {
        fontSize: 12,
        color: 'colors.textSecondary',
        marginTop: 2,
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    placeholder: {
        fontSize: 16,
        color: 'colors.textMuted',
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'colors.border',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'colors.textPrimary',
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.canvas,
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: 'colors.textPrimary',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: 'colors.textSecondary',
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        color: 'colors.danger',
        textAlign: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: 'colors.textSecondary',
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    resultContent: {
        flex: 1,
    },
    resultText: {
        fontSize: 16,
        color: 'colors.textPrimary',
    },
    resultSubtitle: {
        fontSize: 13,
        color: 'colors.textSecondary',
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: colors.canvas,
    },
});
