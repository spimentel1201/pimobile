import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Customer, CreateCustomerDto } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

const CustomersScreen = () => {
  const { user } = useAuth();
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
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Clientes</Text>
      <TouchableOpacity style={styles.addButton} onPress={openNewCustomerModal}>
        <MaterialCommunityIcons name="plus" size={20} color="white" />
        <Text style={styles.addButtonText}>Nuevo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsContainer}>
      <View style={styles.metricCard}>
        <MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />
        <Text style={styles.metricValue}>{customers.length}</Text>
        <Text style={styles.metricLabel}>Total Clientes</Text>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre, teléfono o documento..."
        placeholderTextColor="#9CA3AF"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => handleSearch('')}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerDocument}>
            {item.documentType}: {item.documentNumber}
          </Text>
          {item.email && (
            <Text style={styles.customerEmail}>{item.email}</Text>
          )}
        </View>
      </View>

      <View style={styles.contactRow}>
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: '#3B82F6' }]}
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
            style={[styles.contactButton, { backgroundColor: '#EF4444' }]}
            onPress={() => handleContact('email', item.email!)}
          >
            <MaterialCommunityIcons name="email" size={18} color="white" />
          </TouchableOpacity>
        )}
        <View style={styles.actionsSpacer} />
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
          onPress={() => openEditCustomerModal(item)}
        >
          <MaterialCommunityIcons name="pencil" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
          onPress={() => handleDeleteCustomer(item)}
        >
          <MaterialCommunityIcons name="delete" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </Text>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <MaterialCommunityIcons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Tipo Doc. *</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setFormData({ ...formData, documentType: formData.documentType === 'DNI' ? 'RUC' : 'DNI' })}
                >
                  <Text style={styles.pickerText}>{formData.documentType}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Número Doc. *</Text>
              <TextInput
                style={styles.input}
                placeholder="00000000"
                value={formData.documentNumber}
                onChangeText={(text) => setFormData({ ...formData, documentNumber: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              placeholder="999999999"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
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
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelButton]}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSaveCustomer}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingCustomer ? 'Actualizar' : 'Guardar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCustomers}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-off" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay clientes</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openNewCustomerModal}>
              <Text style={styles.emptyButtonText}>Agregar primer cliente</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  customerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  customerDocument: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  customerEmail: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSpacer: {
    flex: 1,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default CustomersScreen;