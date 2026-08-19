import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { Customer, CreateCustomerDto } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { Badge } from '../../components/ui/Badge';
import { spacing, typography, radii, shadows } from '../../constants/theme';

const CustomersScreen = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: '',
    email: '',
    phone: '',
    documentType: 'DNI',
    documentNumber: '',
    address: '',
  });

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

  const handleContact = (type: 'phone' | 'whatsapp' | 'email', contact: string) => {
    switch (type) {
      case 'phone':
        Linking.openURL(`tel:${contact}`);
        break;
      case 'whatsapp':
        Linking.openURL(`https://wa.me/${contact.replace(/\D/g, '')}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${contact}`);
        break;
    }
  };

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      documentType: 'DNI',
      documentNumber: '',
      address: '',
    });
    setShowModal(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      address: customer.address || '',
    });
    setShowModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name || !formData.phone || !formData.documentNumber) {
      Alert.alert('Error', 'Por favor complete los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
        Alert.alert('Éxito', 'Cliente actualizado correctamente');
      } else {
        await api.createCustomer(formData);
        Alert.alert('Éxito', 'Cliente creado correctamente');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro que desea eliminar a ${customer.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCustomer(customer.id);
              Alert.alert('Éxito', 'Cliente eliminado correctamente');
              fetchCustomers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el cliente');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Clientes</Text>
      <Button
        title="Nuevo"
        onPress={openNewCustomerModal}
        variant="primary"
        size="sm"
        icon={<MaterialCommunityIcons name="plus" size={18} color="white" />}
      />
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsContainer}>
      <Card variant="elevated" padding={spacing.base} style={styles.metricCard}>
        <MaterialCommunityIcons name="account-group" size={24} color={theme.primary} />
        <Text style={[styles.metricValue, { color: theme.text }]}>{customers.length}</Text>
        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Clientes</Text>
      </Card>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Input
        placeholder="Buscar por nombre, teléfono o documento..."
        value={searchQuery}
        onChangeText={handleSearch}
        leftIcon={<MaterialCommunityIcons name="magnify" size={20} color={theme.textMuted} />}
        rightIcon={
          searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          ) : undefined
        }
        containerStyle={styles.searchInputContainer}
      />
    </View>
  );

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Card variant="elevated" padding={spacing.base} style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <Avatar name={item.name} size={48} />
          <View style={styles.customerInfo}>
            <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
            <View style={styles.documentRow}>
              <Badge label={item.documentType} variant="default" size="sm" />
              <Text style={[styles.customerDocument, { color: theme.textSecondary }]}>
                {item.documentNumber}
              </Text>
            </View>
            {item.email && (
              <Text style={[styles.customerEmail, { color: theme.primary }]}>{item.email}</Text>
            )}
          </View>
        </View>

        <View style={[styles.contactRow, { borderTopColor: theme.divider }]}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: theme.primary }]}
            onPress={() => handleContact('phone', item.phone)}
          >
            <MaterialCommunityIcons name="phone" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: '#25D366' }]}
            onPress={() => handleContact('whatsapp', item.phone)}
          >
            <MaterialCommunityIcons name="whatsapp" size={18} color="white" />
          </TouchableOpacity>
          {item.email && (
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.error }]}
              onPress={() => handleContact('email', item.email!)}
            >
              <MaterialCommunityIcons name="email" size={18} color="white" />
            </TouchableOpacity>
          )}
          <View style={styles.actionsSpacer} />
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.warning }]}
            onPress={() => openEditCustomerModal(item)}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.error }]}
            onPress={() => handleDeleteCustomer(item)}
          >
            <MaterialCommunityIcons name="delete" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );

  const renderModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </Text>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Nombre *"
            placeholder="Nombre completo"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Tipo Doc. *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                onPress={() => setFormData({ ...formData, documentType: formData.documentType === 'DNI' ? 'RUC' : 'DNI' })}
              >
                <Text style={[styles.pickerText, { color: theme.text }]}>{formData.documentType}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Input
                label="Número Doc. *"
                placeholder="00000000"
                value={formData.documentNumber}
                onChangeText={(text) => setFormData({ ...formData, documentNumber: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input
            label="Teléfono *"
            placeholder="999999999"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />

          <Input
            label="Email"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Dirección"
            placeholder="Dirección completa"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
          />
        </ScrollView>

        <View style={[styles.modalFooter, { backgroundColor: theme.headerBg, borderTopColor: theme.headerBorder, paddingBottom: spacing.base + insets.bottom }]}>
          <Button
            title="Cancelar"
            onPress={() => setShowModal(false)}
            variant="secondary"
            size="md"
            style={styles.footerButton}
          />
          <Button
            title={editingCustomer ? 'Actualizar' : 'Guardar'}
            onPress={handleSaveCustomer}
            variant="primary"
            size="md"
            loading={saving}
            disabled={saving}
            style={styles.footerButton}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <SkeletonLoader lines={4} lineHeight={60} borderRadius={radii.lg} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <Button
          title="Reintentar"
          onPress={fetchCustomers}
          variant="primary"
          size="md"
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
      {renderHeader()}
      {renderMetrics()}
      {renderSearchBar()}
      <FlatList
        data={customers}
        renderItem={renderCustomerCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-off"
            title="No hay clientes"
            message="Agrega tu primer cliente para comenzar"
          />
        }
      />
      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginTop: spacing.sm,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  customerCard: {
    marginBottom: spacing.md,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  customerName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xs'],
  },
  customerDocument: {
    fontSize: typography.sizes.sm,
  },
  customerEmail: {
    fontSize: typography.sizes.sm,
    marginTop: spacing['2xs'],
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSpacer: {
    flex: 1,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  modalContent: {
    flex: 1,
    padding: spacing.base,
  },
  inputContainer: {
    marginBottom: spacing.base,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    minHeight: 48,
  },
  pickerText: {
    fontSize: typography.sizes.base,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.base,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});

export default CustomersScreen;
