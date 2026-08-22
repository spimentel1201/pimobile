import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Modal,
  Switch,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { Product, CreateProductDto } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { colors, typography, spacing, radii } from '../../constants/theme';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const ProductsScreen = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; variant: 'danger' | 'success' | 'warning' | 'info'; onConfirm: () => void }>({ title: '', message: '', variant: 'info', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info', onConfirm: () => void) => {
    setConfirmConfig({ title, message, variant, onConfirm });
    setConfirmVisible(true);
  };

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
        showConfirm('Éxito', 'Producto actualizado correctamente', 'success', () => {
          setShowModal(false);
          fetchProducts();
        });
      } else {
        await api.createProduct(formData);
        showConfirm('Éxito', 'Producto creado correctamente', 'success', () => {
          setShowModal(false);
          fetchProducts();
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    showConfirm('Eliminar Producto', '¿Está seguro que desea eliminar este producto?', 'danger', async () => {
      try {
        await api.deleteProduct(product.id);
        showConfirm('Éxito', 'Producto eliminado correctamente', 'success', () => {
          fetchProducts();
        });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo eliminar el producto');
      }
    });
  };

  const handleUpdateStock = (product: Product, quantity: number) => {
    showConfirm('Actualizar Stock', `Stock actual: ${product.stock}\n¿Cuántas unidades desea ${quantity > 0 ? 'agregar' : 'restar'}?`, 'warning', async () => {
      try {
        await api.updateProductStock(product.id, quantity);
        showConfirm('Éxito', 'Stock actualizado correctamente', 'success', () => {
          fetchProducts();
        });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo actualizar el stock');
      }
    });
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder, paddingTop: insets.top + spacing.base }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Productos</Text>
      <Button
        title="Nuevo"
        onPress={openNewProductModal}
        variant="primary"
        size="sm"
        icon={<MaterialIcons name="add" size={20} color={colors.white} />}
      />
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={[styles.filtersSection, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.inputBg }]}>
        <MaterialIcons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar productos..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <MaterialIcons
            name="close"
            size={20}
            color={theme.textMuted}
            onPress={() => handleSearch('')}
          />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        <View
          style={[styles.categoryChip, { backgroundColor: selectedCategory === 'all' ? colors.primary : theme.surfaceVariant }]}
        >
          <Text
            style={[styles.categoryChipText, { color: selectedCategory === 'all' ? colors.white : theme.textSecondary }]}
            onPress={() => setSelectedCategory('all')}
          >
            Todas
          </Text>
        </View>
        {categories.map((category) => (
          <View
            key={category}
            style={[styles.categoryChip, { backgroundColor: selectedCategory === category ? colors.primary : theme.surfaceVariant }]}
          >
            <Text
              style={[styles.categoryChipText, { color: selectedCategory === category ? colors.white : theme.textSecondary }]}
              onPress={() => setSelectedCategory(category)}
            >
              {category}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderProductCard = ({ item, index }: { item: Product; index: number }) => {
    const profit = item.price - item.cost;
    const profitMargin = item.cost > 0 ? ((profit / item.cost) * 100).toFixed(1) : '0';

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <Card
          variant="elevated"
          padding={spacing.base}
          style={[{ marginBottom: spacing.md }, !item.isActive && styles.productCardInactive]}
        >
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.productCategory, { color: theme.textSecondary }]}>{item.category}</Text>
            </View>
            <Badge
              label={item.isActive ? 'Activo' : 'Inactivo'}
              variant={item.isActive ? 'success' : 'default'}
              size="sm"
            />
          </View>

          {item.description && (
            <Text style={[styles.productDescription, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={[styles.priceRow, { borderTopColor: theme.borderLight, borderBottomColor: theme.borderLight }]}>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Costo</Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>S/ {item.cost.toFixed(2)}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Precio</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>S/ {item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Margen</Text>
              <Text style={[styles.priceValue, { color: profit > 0 ? colors.success : colors.error }]}>
                {profitMargin}%
              </Text>
            </View>
          </View>

          <View style={styles.stockRow}>
            <View style={styles.stockInfo}>
              <MaterialCommunityIcons name="package-variant" size={20} color={theme.textSecondary} />
              <Text
                style={[
                  styles.stockText,
                  { color: theme.textSecondary },
                  item.stock <= 5 && { color: colors.warning },
                  item.stock === 0 && { color: colors.error },
                ]}
              >
                {item.stock} unidades
              </Text>
            </View>
            <View style={styles.stockActions}>
              <TouchableOpacity
                style={[styles.stockButton, { backgroundColor: theme.primaryLight }]}
                onPress={() => handleUpdateStock(item, 1)}
              >
                <MaterialIcons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stockButton, { backgroundColor: colors.errorLight }]}
                onPress={() => handleUpdateStock(item, -1)}
              >
                <MaterialIcons name="remove" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.productActions, { borderTopColor: theme.borderLight }]}>
            <Button
              title=""
              onPress={() => openEditProductModal(item)}
              variant="primary"
              size="sm"
              icon={<MaterialIcons name="edit" size={18} color={colors.white} />}
              style={styles.actionButton}
            />
            <Button
              title=""
              onPress={() => handleDeleteProduct(item)}
              variant="danger"
              size="sm"
              icon={<MaterialIcons name="delete" size={18} color={colors.white} />}
              style={styles.actionButton}
            />
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>
          <MaterialIcons
            name="close"
            size={24}
            color={theme.textSecondary}
            onPress={() => setShowModal(false)}
          />
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Nombre *"
            placeholder="Nombre del producto"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Input
            label="Descripción"
            placeholder="Descripción del producto"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={3}
            containerStyle={styles.textAreaContainer}
          />

          <Input
            label="Categoría *"
            placeholder="Ej: Repuestos, Accesorios..."
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
          />

          <View style={styles.row}>
            <Input
              label="Costo *"
              placeholder="0.00"
              value={formData.cost?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, cost: parseFloat(text) || 0 })}
              keyboardType="numeric"
              containerStyle={styles.halfWidth}
              leftIcon={
                <View style={[styles.currencySymbol, { backgroundColor: theme.inputBg, borderRightColor: theme.border }]}>
                  <Text style={[styles.currencySymbolText, { color: theme.textSecondary }]}>S/</Text>
                </View>
              }
            />
            <Input
              label="Precio *"
              placeholder="0.00"
              value={formData.price?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, price: parseFloat(text) || 0 })}
              keyboardType="numeric"
              containerStyle={styles.halfWidth}
              leftIcon={
                <View style={[styles.currencySymbol, { backgroundColor: theme.inputBg, borderRightColor: theme.border }]}>
                  <Text style={[styles.currencySymbolText, { color: theme.textSecondary }]}>S/</Text>
                </View>
              }
            />
          </View>

          <Input
            label="Stock inicial"
            placeholder="0"
            value={formData.stock?.toString() || ''}
            onChangeText={(text) => setFormData({ ...formData, stock: parseInt(text) || 0 })}
            keyboardType="numeric"
          />

          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Producto activo</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              trackColor={{ false: theme.inputBorder, true: colors.primaryLight }}
              thumbColor={formData.isActive ? colors.primary : theme.textMuted}
            />
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { backgroundColor: theme.headerBg, borderTopColor: theme.border }]}>
          <Button
            title="Cancelar"
            onPress={() => setShowModal(false)}
            variant="secondary"
            size="md"
            style={styles.footerButton}
          />
          <Button
            title={editingProduct ? 'Actualizar' : 'Guardar'}
            onPress={handleSaveProduct}
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
        <SkeletonLoader lines={5} lineHeight={16} borderRadius={radii.md} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Cargando productos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <MaterialIcons name="error" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Button
          title="Reintentar"
          onPress={fetchProducts}
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
          <EmptyState
            icon="package-variant-closed"
            title="No hay productos"
            message="Agrega tu primer producto para comenzar a vender."
          />
        }
      />
      {renderModal()}
      <ConfirmDialog
        visible={confirmVisible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmLabel={confirmConfig.variant === 'danger' ? 'Eliminar' : 'Aceptar'}
        onConfirm={() => { confirmConfig.onConfirm(); setConfirmVisible(false); }}
        onCancel={() => setConfirmVisible(false)}
      />
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
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
  filtersSection: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  searchInput: {
    flex: 1,
    height: spacing['3xl'],
    fontSize: typography.sizes.base,
    marginLeft: spacing.sm,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    marginRight: spacing.sm,
  },
  categoryChipText: {
    fontSize: typography.sizes.sm,
  },
  listContent: {
    padding: spacing.base,
  },
  productCardInactive: {
    opacity: 0.6,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  productCategory: {
    fontSize: typography.sizes.xs,
    marginTop: spacing['2xs'],
  },
  productDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: typography.sizes.xs,
  },
  priceValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  stockActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stockButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  actionButton: {
    width: spacing['2xl'] + spacing.sm,
    height: spacing['2xl'] + spacing.sm,
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
  textAreaContainer: {
    minHeight: spacing['4xl'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  currencySymbol: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRightWidth: 1,
  },
  currencySymbolText: {
    fontSize: typography.sizes.base,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
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

export default ProductsScreen;
