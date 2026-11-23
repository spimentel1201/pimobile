// ponytail: M3 CustomersScreen with metric cards, search, FlashList, BottomSheet and quick actions
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Linking,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { api } from '../services/api';
import { Customer, CreateCustomerDto } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import BottomSheet from '../components/ui/BottomSheet';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import MetricCard from '../components/ui/MetricCard';
import Toast from '../components/ui/Toast';
import Card from '../components/ui/Card';
import M3Fab from '../components/ui/M3Fab';
import M3TextField from '../components/ui/M3TextField';
import { NO_PHONE_MESSAGE, buildTelUrl, buildWhatsAppUrl } from '../utils/phone';
import {
  colors,
  radii,
  spacing,
  typography,
  tonalElevation,
} from '../theme';

type CustomerFormErrors = Partial<Record<'name' | 'phone' | 'documentNumber', string>>;

const emptyForm: CreateCustomerDto = {
  name: '',
  email: '',
  phone: '',
  documentType: 'DNI',
  documentNumber: '',
  address: '',
};

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({});
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<CreateCustomerDto>(emptyForm);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const fetchCustomers = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Error al cargar los clientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    } else {
      setLoading(false);
    }
  }, [fetchCustomers, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.documentNumber && c.documentNumber.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const metrics = useMemo(() => {
    const total = customers.length;
    const withPhone = customers.filter((c) => Boolean(c.phone)).length;
    const withEmail = customers.filter((c) => Boolean(c.email)).length;
    return { total, withPhone, withEmail };
  }, [customers]);

  const openPhone = (phone: string) => {
    const url = buildTelUrl(phone);
    if (!url) {
      showToast(NO_PHONE_MESSAGE, 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('No se pudo abrir el teléfono', 'error'));
  };

  const openWhatsApp = (phone: string, name?: string) => {
    const message = name ? `Hola, ${name}, te contactamos de Electro-Pime.` : null;
    const url = buildWhatsAppUrl(phone, message);
    if (!url) {
      showToast(NO_PHONE_MESSAGE, 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('No se pudo abrir WhatsApp', 'error'));
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowSheet(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      documentType: customer.documentType || 'DNI',
      documentNumber: customer.documentNumber || '',
      address: customer.address || '',
    });
    setFormErrors({});
    setShowSheet(true);
  };

  const validate = (): boolean => {
    const errs: CustomerFormErrors = {};
    if (!formData.name.trim()) errs.name = 'Ingrese el nombre completo';
    if (!formData.phone.trim()) errs.phone = 'Ingrese el número de teléfono';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
        showToast('Cliente actualizado correctamente');
      } else {
        await api.createCustomer(formData);
        showToast('Cliente registrado con éxito');
      }
      setShowSheet(false);
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'No se pudo guardar el cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.deleteCustomer(toDelete.id);
      setToDelete(null);
      showToast('Cliente eliminado');
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'No se pudo eliminar el cliente', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => {
    const isRuc = item.documentType?.toUpperCase() === 'RUC';

    return (
      <Card style={styles.customerCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.docRow}>
              <View style={[styles.docBadge, isRuc ? styles.docBadgeRuc : styles.docBadgeDni]}>
                <Text style={[styles.docBadgeText, isRuc ? styles.docBadgeTextRuc : styles.docBadgeTextDni]}>
                  {item.documentType || 'DNI'}: {item.documentNumber || '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact info row */}
        <View style={styles.contactDetailsRow}>
          {item.phone ? (
            <View style={styles.contactDetailItem}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.contactDetailText}>{item.phone}</Text>
            </View>
          ) : null}

          {item.email ? (
            <View style={styles.contactDetailItem}>
              <MaterialCommunityIcons name="email-outline" size={16} color={colors.textMuted} />
              <Text style={styles.contactDetailText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          ) : null}
        </View>

        {item.address ? (
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        ) : null}

        {/* Quick Action buttons */}
        <View style={styles.actionsRow}>
          {item.phone ? (
            <>
              <Pressable
                style={styles.actionPillBtn}
                onPress={() => openPhone(item.phone)}
                android_ripple={{ color: 'rgba(0, 82, 255, 0.15)' }}
              >
                <MaterialCommunityIcons name="phone" size={18} color={colors.primary} />
                <Text style={styles.actionPillText}>Llamar</Text>
              </Pressable>

              <Pressable
                style={[styles.actionPillBtn, styles.actionPillSuccess]}
                onPress={() => openWhatsApp(item.phone, item.name)}
                android_ripple={{ color: 'rgba(0, 109, 68, 0.15)' }}
              >
                <MaterialCommunityIcons name="whatsapp" size={18} color={colors.success} />
                <Text style={[styles.actionPillText, { color: colors.success }]}>WhatsApp</Text>
              </Pressable>
            </>
          ) : null}

          <View style={styles.spacer} />

          <Pressable
            style={styles.iconActionBtn}
            onPress={() => handleOpenEdit(item)}
            hitSlop={8}
            android_ripple={{ color: 'rgba(0, 82, 255, 0.15)', borderless: true, radius: 20 }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
          </Pressable>

          <Pressable
            style={styles.iconActionBtn}
            onPress={() => setToDelete(item)}
            hitSlop={8}
            android_ripple={{ color: 'rgba(186, 26, 26, 0.15)', borderless: true, radius: 20 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + spacing.xs }]}>
        <Text style={styles.screenTitle}>Directorio de Clientes</Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <MetricCard
          label="Total Clientes"
          value={String(metrics.total)}
          icon="account-group"
          style={styles.metricCard}
        />
        <MetricCard
          label="Con Teléfono"
          value={String(metrics.withPhone)}
          icon="phone-check"
          iconColor={colors.success}
          iconBg={colors.successSoft}
          style={styles.metricCard}
        />
      </View>

      {/* Search Bar M3 */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, documento o teléfono..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.listContainer}>
        {filteredCustomers.length === 0 ? (
          <EmptyState
            icon="account-search-outline"
            title="Sin clientes encontrados"
            description={
              searchQuery
                ? `No hay coincidencias para "${searchQuery}".`
                : 'Añade tu primer cliente registrado en el sistema.'
            }
            ctaLabel={searchQuery ? 'Limpiar búsqueda' : 'Nuevo Cliente'}
            onCta={searchQuery ? () => setSearchQuery('') : handleOpenCreate}
          />
        ) : (
          <FlashList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={renderCustomerCard}
            estimatedItemSize={160}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
      </View>

      {/* Extended FAB */}
      <View style={[styles.fabWrapper, { bottom: insets.bottom + 80 }]}>
        <M3Fab
          label="Nuevo Cliente"
          icon="account-plus-outline"
          onPress={handleOpenCreate}
        />
      </View>

      {/* Create / Edit BottomSheet */}
      {showSheet && (
        <BottomSheet
          visible={showSheet}
          title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
          onClose={() => setShowSheet(false)}
          footer={
            <Pressable
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                </Text>
              )}
            </Pressable>
          }
        >
          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
            <M3TextField
              label="Nombre completo *"
              placeholder="Ej: Juan Pérez Martínez"
              value={formData.name}
              onChangeText={(text) => setFormData((p) => ({ ...p, name: text }))}
              error={formErrors.name}
              leadingIcon="account-outline"
            />

            <View style={styles.docTypeRow}>
              {(['DNI', 'RUC', 'OTRO'] as const).map((dt) => {
                const isSelected = formData.documentType === dt;
                return (
                  <Pressable
                    key={dt}
                    style={[styles.docTypeChip, isSelected && styles.docTypeChipSelected]}
                    onPress={() => setFormData((p) => ({ ...p, documentType: dt }))}
                  >
                    <Text style={[styles.docTypeChipText, isSelected && styles.docTypeChipTextSelected]}>
                      {dt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <M3TextField
              label="Número de Documento"
              placeholder="Número de DNI o RUC..."
              value={formData.documentNumber}
              onChangeText={(text) => setFormData((p) => ({ ...p, documentNumber: text }))}
              keyboardType="numeric"
              leadingIcon="card-account-details-outline"
            />

            <M3TextField
              label="Teléfono / Celular *"
              placeholder="Ej: 987 654 321"
              value={formData.phone}
              onChangeText={(text) => setFormData((p) => ({ ...p, phone: text }))}
              keyboardType="phone-pad"
              error={formErrors.phone}
              leadingIcon="phone-outline"
            />

            <M3TextField
              label="Correo electrónico (opcional)"
              placeholder="cliente@ejemplo.com"
              value={formData.email}
              onChangeText={(text) => setFormData((p) => ({ ...p, email: text }))}
              keyboardType="email-address"
              leadingIcon="email-outline"
            />

            <M3TextField
              label="Dirección (opcional)"
              placeholder="Calle, avenida o referencia..."
              value={formData.address}
              onChangeText={(text) => setFormData((p) => ({ ...p, address: text }))}
              leadingIcon="map-marker-outline"
            />
          </ScrollView>
        </BottomSheet>
      )}

      {/* Delete Confirmation Dialog */}
      {toDelete && (
        <ConfirmDialog
          visible={Boolean(toDelete)}
          title="Eliminar Cliente"
          message={`¿Confirma que desea eliminar a ${toDelete.name}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          tone="danger"
          busy={deleting}
          icon="trash-can-outline"
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  screenTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  metricCard: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    minHeight: 48,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  customerCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  customerName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  docRow: {
    marginTop: 2,
  },
  docBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  docBadgeDni: {
    backgroundColor: colors.primarySoft,
  },
  docBadgeRuc: {
    backgroundColor: colors.violetSoft,
  },
  docBadgeText: {
    ...typography.labelSmall,
    fontSize: 11,
    fontWeight: '700',
  },
  docBadgeTextDni: {
    color: colors.primary,
  },
  docBadgeTextRuc: {
    color: colors.violet,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.3)',
  },
  contactDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactDetailText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addressText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  actionPillSuccess: {
    backgroundColor: colors.successSoft,
  },
  actionPillText: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabWrapper: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 99,
  },
  formScroll: {
    maxHeight: 420,
    paddingVertical: spacing.xs,
  },
  docTypeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  docTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  docTypeChipSelected: {
    backgroundColor: colors.primary,
  },
  docTypeChipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  docTypeChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    ...typography.labelLarge,
    color: colors.white,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.danger,
    flex: 1,
  },
});
