import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Switch,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Product, CreateProductDto } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

const ProductsScreen = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    category: '',
    isActive: true,
    imageUrl: '',
  });

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [productsData, categoriesData] = await Promise.all([
        api.getProducts(),
        api.getProductCategories().catch(() => []),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Error al cargar los productos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [user, fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await api.searchProducts(query);
        setProducts(results);
      } catch (err) {
        console.error('Search error:', err);
      }
    } else if (query.length === 0) {
      fetchProducts();
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      cost: 0,
      stock: 0,
      category: categories[0] || '',
      isActive: true,
      imageUrl: '',
    });
    setShowModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      category: product.category,
      isActive: product.isActive,
      imageUrl: product.imageUrl || '',
    });
    setShowModal(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.category) {
      Alert.alert('Error', 'Por favor complete los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        await api.createProduct(formData);
        Alert.alert('Éxito', 'Producto creado correctamente');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro que desea eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProduct(product.id);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              fetchProducts();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const handleUpdateStock = (product: Product, quantity: number) => {
    Alert.alert(
      'Actualizar Stock',
      `Stock actual: ${product.stock}\n¿Cuántas unidades desea ${quantity > 0 ? 'agregar' : 'restar'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.updateProductStock(product.id, quantity);
              Alert.alert('Éxito', 'Stock actualizado correctamente');
              fetchProducts();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo actualizar el stock');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Productos</Text>
      <TouchableOpacity style={styles.addButton} onPress={openNewProductModal}>
        <MaterialIcons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Nuevo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.filtersSection}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <MaterialIcons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderProductCard = ({ item }: { item: Product }) => {
    const profit = item.price - item.cost;
    const profitMargin = item.cost > 0 ? ((profit / item.cost) * 100).toFixed(1) : '0';

    return (
      <View style={[styles.productCard, !item.isActive && styles.productCardInactive]}>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#10B981' : '#9CA3AF' }]}>
            <Text style={styles.statusBadgeText}>{item.isActive ? 'Activo' : 'Inactivo'}</Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Costo</Text>
            <Text style={styles.priceValue}>S/ {item.cost.toFixed(2)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Precio</Text>
            <Text style={[styles.priceValue, styles.priceValueHighlight]}>S/ {item.price.toFixed(2)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Margen</Text>
            <Text style={[styles.priceValue, { color: profit > 0 ? '#10B981' : '#EF4444' }]}>
              {profitMargin}%
            </Text>
          </View>
        </View>

        <View style={styles.stockRow}>
          <View style={styles.stockInfo}>
            <MaterialCommunityIcons name="package-variant" size={20} color="#6B7280" />
            <Text style={[
              styles.stockText,
              item.stock <= 5 && styles.stockLow,
              item.stock === 0 && styles.stockOut
            ]}>
              {item.stock} unidades
            </Text>
          </View>
          <View style={styles.stockActions}>
            <TouchableOpacity
              style={styles.stockButton}
              onPress={() => handleUpdateStock(item, 1)}
            >
              <MaterialIcons name="add" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stockButton}
              onPress={() => handleUpdateStock(item, -1)}
            >
              <MaterialIcons name="remove" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.productActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => openEditProductModal(item)}
          >
            <MaterialIcons name="edit" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={() => handleDeleteProduct(item)}
          >
            <MaterialIcons name="delete" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <MaterialIcons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del producto"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción del producto"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Categoría *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Repuestos, Accesorios..."
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Costo *</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencySymbol}>S/</Text>
                <TextInput
                  style={styles.currencyField}
                  placeholder="0.00"
                  value={formData.cost?.toString() || ''}
                  onChangeText={(text) => setFormData({ ...formData, cost: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Precio *</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencySymbol}>S/</Text>
                <TextInput
                  style={styles.currencyField}
                  placeholder="0.00"
                  value={formData.price?.toString() || ''}
                  onChangeText={(text) => setFormData({ ...formData, price: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Stock inicial</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.stock?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, stock: parseInt(text) || 0 })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Producto activo</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={formData.isActive ? '#3B82F6' : '#9CA3AF'}
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
            onPress={handleSaveProduct}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingProduct ? 'Actualizar' : 'Guardar'}
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
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSearchAndFilters()}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant-closed" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay productos</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openNewProductModal}>
              <Text style={styles.emptyButtonText}>Agregar primer producto</Text>
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
  filtersSection: {
    backgroundColor: 'white',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 16,
  },
  productCard: {
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
  productCardInactive: {
    opacity: 0.6,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  priceValueHighlight: {
    color: '#3B82F6',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  stockLow: {
    color: '#F59E0B',
  },
  stockOut: {
    color: '#EF4444',
  },
  stockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stockButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  currencySymbol: {
    padding: 12,
    fontSize: 16,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  currencyField: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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

export default ProductsScreen;