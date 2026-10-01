import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Linking,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../services/api';
import { Customer, CreateCustomerDto } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import BottomSheet from '../components/ui/BottomSheet';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import MetricCard from '../components/ui/MetricCard';
import Toast from '../components/ui/Toast';
import {
  NO_PHONE_MESSAGE,
  buildTelUrl,
  buildWhatsAppUrl,
} from '../utils/phone';
import { colors, radii, shadow, spacing, typography } from '../theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type CustomerFormErrors = Partial<Record<'name' | 'phone' | 'documentNumber', string>>;

const emptyForm: CreateCustomerDto = {
  name: '',
  email: '',
  phone: '',
  documentType: 'DNI',
  documentNumber: '',
  address: '',
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || '—';

/** Tono del pill según el tipo de documento del cliente */
const documentTone = (documentType: string) => {
  switch ((documentType || '').toUpperCase()) {
    case 'RUC':
      return { label: 'RUC', color: colors.violet, soft: colors.violetSoft };
    case 'DNI':
      return { label: 'DNI', color: colors.primary, soft: colors.primarySoft };
    default:
      return { label: documentType || 'Sin Doc.', color: colors.textSecondary, soft: colors.surfaceMuted };
  }
};

function Pill({ label, color, soft }: { label: string; color: string; soft: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: soft }]}>
      <Text style={[styles.pillText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const CustomersScreen = () => {
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
  const [successDialog, setSuccessDialog] = useState<{
    title: string;
    message: string;
    details: { label: string; value: string }[];
  } | null>(null);
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
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
  }, [user, fetchCustomers]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await api.searchCustomers(query);
        setCustomers(results);
      } catch (err) {
        console.error('Search error:', err);
      }
    } else if (query.length === 0) {
      fetchCustomers();
    }
  };

  const withEmail = useMemo(() => customers.filter(c => !!c.email).length, [customers]);
  const withAddress = useMemo(() => customers.filter(c => !!c.address).length, [customers]);

  /** Abre el marcador con prefijo internacional: tel:+51<numero> */
  const openPhone = (raw: string) => {
    const url = buildTelUrl(raw);
    if (!url) {
      showToast(NO_PHONE_MESSAGE, 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('No se pudo abrir el teléfono', 'error'));
  };

  /** Abre WhatsApp en wa.me/51<numero> */
  const openWhatsApp = (raw: string) => {
    const url = buildWhatsAppUrl(raw);
    if (!url) {
      showToast(NO_PHONE_MESSAGE, 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('No se pudo abrir WhatsApp', 'error'));
  };

  const openEmail = (address: string) => {
    if (!address) {
      showToast('Este cliente no tiene un correo válido', 'error');
      return;
    }
    Linking.openURL(`mailto:${address}`).catch(() => showToast('No se pudo abrir el correo', 'error'));
  };

  const openNewCustomerSheet = () => {
    setEditingCustomer(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setShowSheet(true);
  };

  const openEditCustomerSheet = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      address: customer.address || '',
    });
    setFormErrors({});
    setShowSheet(true);
  };

  const closeSheet = () => {
    if (saving) return;
    setShowSheet(false);
    setFormErrors({});
  };

  /** Validación por campo con mensajes inline bajo el input */
  const validateForm = (): CustomerFormErrors => {
    const errors: CustomerFormErrors = {};
    const name = (formData.name || '').trim();
    const phoneDigits = (formData.phone || '').replace(/\D/g, '');

    if (!name) {
      errors.name = 'Ingresa el nombre del cliente';
    } else if (name.length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!phoneDigits) {
      errors.phone = 'Ingresa un número de teléfono';
    } else if (phoneDigits.length < 7) {
      errors.phone = 'El teléfono debe tener al menos 7 dígitos';
    }

    if (!(formData.documentNumber || '').trim()) {
      errors.documentNumber = 'Ingresa el número de documento';
    }

    return errors;
  };

  const handleSaveCustomer = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload: CreateCustomerDto = {
      ...formData,
      name: (formData.name || '').trim(),
      email: (formData.email || '').trim() || undefined,
      phone: (formData.phone || '').trim(),
      documentType: formData.documentType || 'DNI',
      documentNumber: (formData.documentNumber || '').trim(),
      address: (formData.address || '').trim() || undefined,
    };

    setSaving(true);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
      } else {
        await api.createCustomer(payload);
      }
      setShowSheet(false);
      setFormErrors({});
      setSuccessDialog({
        title: editingCustomer ? 'Cliente actualizado' : 'Cliente registrado',
        message: editingCustomer
          ? `Se actualizaron los datos de “${payload.name}”.`
          : `“${payload.name}” ya está en el directorio.`,
        details: [
          { label: 'Documento', value: `${payload.documentType} ${payload.documentNumber}` },
          { label: 'Teléfono', value: payload.phone },
          { label: 'Correo', value: payload.email || 'Sin registrar' },
        ],
      });
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'No se pudo guardar el cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCustomer = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.deleteCustomer(toDelete.id);
      showToast('Cliente eliminado correctamente');
      setToDelete(null);
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'No se pudo eliminar el cliente', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.headerLabel}>DIRECTORIO</Text>
        <Text style={styles.headerTitle}>Clientes</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={openNewCustomerSheet}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Nuevo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsRow}>
      <MetricCard
        label="Total Clientes"
        value={String(customers.length)}
        icon="account-group"
        variant="hero"
      />
      <MetricCard
        label="Con Correo"
        value={String(withEmail)}
        icon="email-outline"
        variant="default"
      />
      <MetricCard
        label="Con Dirección"
        value={String(withAddress)}
        icon="map-marker-outline"
        variant="default"
      />
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchCard}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, teléfono o documento..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.searchMeta}>
        {searchQuery.trim().length >= 2
          ? `${customers.length} resultado${customers.length === 1 ? '' : 's'} para “${searchQuery.trim()}”`
          : `${customers.length} cliente${customers.length === 1 ? '' : 's'} en el directorio`}
      </Text>
    </View>
  );

  const renderCustomerCard = ({ item }: { item: Customer }) => {
    const tone = documentTone(item.documentType);

    return (
      <View style={styles.customerCard}>
        {/* Banda superior: etiqueta micro + tipo de documento en pill */}
        <View style={styles.cardBand}>
          <View style={styles.cardBandTitle}>
            <MaterialCommunityIcons name="account-outline" size={16} color={colors.primary} />
            <Text style={styles.cardBandLabel} numberOfLines={1}>
              CLIENTE REGISTRADO
            </Text>
          </View>
          <Pill label={tone.label} color={tone.color} soft={tone.soft} />
        </View>

        <View style={styles.cardBody}>
          {/* Identidad */}
          <View style={styles.personRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.personMetaRow}>
                <Text style={styles.personMeta} numberOfLines={1}>
                  {item.documentType} {item.documentNumber}
                </Text>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={colors.success}
                  style={styles.verifiedIcon}
                />
                <Text style={styles.personMetaVerified}>Verificado</Text>
              </View>
            </View>
          </View>

          {/* Ficha de contacto */}
          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={colors.textMuted} />
              <Text style={styles.detailLabel}>Teléfono</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {item.phone}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color={colors.textMuted} />
              <Text style={styles.detailLabel}>Correo</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {item.email || 'Sin registrar'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textMuted} />
              <Text style={styles.detailLabel}>Dirección</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {item.address || 'Sin registrar'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.detailLabel}>Registrado</Text>
              <Text style={styles.detailValue}>
                {format(new Date(item.createdAt), 'd MMM yyyy', { locale: es })}
              </Text>
            </View>
          </View>

          {/* Acciones de contacto (solo icono, 44px touch target) */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactIconButton}
              onPress={() => openPhone(item.phone)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Llamar"
            >
              <MaterialCommunityIcons name="phone" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactIconButton, styles.contactIconButtonWhatsapp]}
              onPress={() => openWhatsApp(item.phone)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="WhatsApp"
            >
              <MaterialCommunityIcons name="whatsapp" size={18} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactIconButton, styles.contactIconButtonEmail, !item.email && styles.contactIconButtonDisabled]}
              onPress={() => openEmail(item.email || '')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Enviar correo"
            >
              <MaterialCommunityIcons
                name="email"
                size={18}
                color={item.email ? colors.violet : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Acciones de gestión */}
          <View style={styles.manageRow}>
            <Text style={styles.manageLabel}>Gestionar ficha</Text>
            <View style={styles.actionSpacer} />
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => openEditCustomerSheet(item)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => setToDelete(item)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="delete" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFieldError = (field: keyof CustomerFormErrors) =>
    formErrors[field] ? <Text style={styles.fieldError}>{formErrors[field]}</Text> : null;

  const renderSheet = () => (
    <BottomSheet
      visible={showSheet}
      title={editingCustomer ? 'Editar cliente' : 'Nuevo cliente'}
      subtitle="Los campos con * son obligatorios"
      onClose={closeSheet}
      footer={
        <View style={styles.sheetActions}>
          <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={closeSheet} activeOpacity={0.85}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSaveCustomer}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingCustomer ? 'Actualizar' : 'Guardar cliente'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nombre *</Text>
          <TextInput
            style={[styles.input, formErrors.name && styles.inputError]}
            placeholder="Nombre completo"
            placeholderTextColor={colors.textMuted}
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text });
              if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
            }}
          />
          {renderFieldError('name')}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Tipo Doc. *</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() =>
                  setFormData({ ...formData, documentType: formData.documentType === 'DNI' ? 'RUC' : 'DNI' })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.pickerText}>{formData.documentType}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Número Doc. *</Text>
            <TextInput
              style={[styles.input, formErrors.documentNumber && styles.inputError]}
              placeholder="00000000"
              placeholderTextColor={colors.textMuted}
              value={formData.documentNumber}
              onChangeText={(text) => {
                setFormData({ ...formData, documentNumber: text });
                if (formErrors.documentNumber) setFormErrors({ ...formErrors, documentNumber: undefined });
              }}
              keyboardType="numeric"
            />
            {renderFieldError('documentNumber')}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Teléfono *</Text>
          <TextInput
            style={[styles.input, formErrors.phone && styles.inputError]}
            placeholder="999999999"
            placeholderTextColor={colors.textMuted}
            value={formData.phone}
            onChangeText={(text) => {
              setFormData({ ...formData, phone: text });
              if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
            }}
            keyboardType="phone-pad"
          />
          {renderFieldError('phone')}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Dirección</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Dirección completa"
            placeholderTextColor={colors.textMuted}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <MaterialCommunityIcons name="alert-circle" size={32} color={colors.danger} />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCustomers} activeOpacity={0.85}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderMetrics()}
          {renderSearchBar()}
        </ScrollView>

        <FlatList
          data={customers}
          renderItem={renderCustomerCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon={searchQuery.trim().length >= 2 ? 'account-search-outline' : 'account-off-outline'}
              title={searchQuery.trim().length >= 2 ? 'Sin coincidencias' : 'Aún no hay clientes'}
              description={
                searchQuery.trim().length >= 2
                  ? `No encontramos clientes que coincidan con “${searchQuery.trim()}”.`
                  : 'Registra al primer cliente para poder crear órdenes de reparación.'
              }
              ctaLabel={searchQuery.trim().length >= 2 ? undefined : 'Agregar primer cliente'}
              onCta={searchQuery.trim().length >= 2 ? undefined : openNewCustomerSheet}
              style={styles.emptyState}
            />
          }
        />
      </SafeAreaView>

      {renderSheet()}

      {/* Confirmación al registrar / actualizar */}
      <ConfirmDialog
        visible={!!successDialog}
        icon="check-circle-outline"
        tone="success"
        title={successDialog?.title || ''}
        message={successDialog?.message}
        details={successDialog?.details}
        confirmLabel="Listo"
        onConfirm={() => setSuccessDialog(null)}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        visible={!!toDelete}
        icon="alert-circle-outline"
        tone="danger"
        title="Eliminar cliente"
        message={
          toDelete
            ? `Se eliminará “${toDelete.name}” del directorio. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDeleteCustomer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.canvas,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },

  // Encabezado hero
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerLabel: {
    ...typography.micro,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.display,
    fontSize: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.button,
    ...shadow,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Métricas + buscador
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: colors.textPrimary,
  },
  searchMeta: {
    ...typography.caption,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  // Lista
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },

  // Tarjeta de cliente
  customerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow,
  },
  cardBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  cardBandTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  cardBandLabel: {
    ...typography.micro,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  pill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
    maxWidth: '50%',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardBody: {
    padding: spacing.lg,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  personMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  personMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  personMetaVerified: {
    ...typography.caption,
    color: colors.success,
  },
  detailList: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    flex: 1,
  },
  detailValue: {
    ...typography.bodyStrong,
    flexShrink: 1,
    maxWidth: '58%',
    textAlign: 'right',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  contactIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactIconButtonWhatsapp: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
  },
  contactIconButtonEmail: {
    backgroundColor: colors.violetSoft,
    borderColor: colors.violetSoft,
  },
  contactIconButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    opacity: 0.7,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  manageLabel: {
    ...typography.micro,
    color: colors.textMuted,
  },
  actionSpacer: {
    flex: 1,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: radii.input,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Estado vacío y error
  emptyState: {
    paddingTop: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.button,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },

  // Bottom sheet
  sheetScroll: {
    maxHeight: 420,
  },
  sheetScrollContent: {
    paddingBottom: spacing.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  fieldError: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    overflow: 'hidden',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  pickerText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default CustomersScreen;