// ponytail: M3 ProductScreen with stock badges, category chips, FlashList and BottomSheet editor
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { api } from '../services/api';
import { Product, CreateProductDto } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import StatusBadge from '../components/ui/StatusBadge';
import BottomSheet from '../components/ui/BottomSheet';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Card from '../components/ui/Card';
import M3Fab from '../components/ui/M3Fab';
import M3TextField from '../components/ui/M3TextField';
import EmptyState from '../components/ui/EmptyState';
import Toast from '../components/ui/Toast';
import {
  colors,
  radii,
  spacing,
  typography,
  tonalElevation,
} from '../theme';

type ProductFormErrors = Partial<
  Record<'name' | 'category' | 'cost' | 'price' | 'stock', string>
>;

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
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
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    category: '',
    isActive: true,
  });

  const [costText, setCostText] = useState('');
  const [priceText, setPriceText] = useState('');
  const [stockText, setStockText] = useState('0');
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  };

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
  }, [fetchProducts, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, selectedCategory, searchQuery]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      cost: 0,
      stock: 0,
      category: '',
      isActive: true,
    });
    setCostText('');
    setPriceText('');
    setStockText('0');
    setFormErrors({});
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
    });
    setCostText(product.cost.toString());
    setPriceText(product.price.toString());
    setStockText(product.stock.toString());
    setFormErrors({});
    setShowModal(true);
  };

  const validateProductForm = (): ProductFormErrors => {
    const errs: ProductFormErrors = {};
    if (!formData.name.trim()) errs.name = 'Ingrese el nombre del producto';
    if (!formData.category.trim()) errs.category = 'Ingrese o elija una categoría';
    const c = parseFloat(costText.replace(',', '.'));
    const p = parseFloat(priceText.replace(',', '.'));
    const s = parseInt(stockText, 10);
    if (isNaN(c) || c < 0) errs.cost = 'Costo inválido';
    if (isNaN(p) || p <= 0) errs.price = 'Precio inválido';
    if (isNaN(s) || s < 0) errs.stock = 'Stock inválido';
    return errs;
  };

  const handleSaveProduct = async () => {
    const errs = validateProductForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload: CreateProductDto = {
        ...formData,
        cost: parseFloat(costText.replace(',', '.')) || 0,
        price: parseFloat(priceText.replace(',', '.')) || 0,
        stock: parseInt(stockText, 10) || 0,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showToast('Producto actualizado correctamente');
      } else {
        await api.createProduct(payload);
        showToast('Producto agregado al inventario');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'No se pudo guardar el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStock = async (product: Product, delta: number) => {
    const newStock = product.stock + delta;
    if (newStock < 0) return;

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
    );

    try {
      await api.updateProductStock(product.id, delta);
    } catch {
      fetchProducts();
    }
  };

  const handleDeleteProduct = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.deleteProduct(toDelete.id);
      setToDelete(null);
      showToast('Producto eliminado');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'No se pudo eliminar el producto', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const isLowStock = item.stock <= 3;

    return (
      <Card style={styles.productCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{item.category || 'General'}</Text>
          </View>

          <StatusBadge
            label={item.isActive ? 'Activo' : 'Inactivo'}
            color={item.isActive ? colors.success : colors.textMuted}
            soft={item.isActive ? colors.successSoft : colors.surfaceMuted}
            compact
          />
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        {item.description ? (
          <Text style={styles.productDesc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.pricesRow}>
          <View>
            <Text style={styles.priceLabel}>Precio de Venta</Text>
            <Text style={styles.priceValue}>S/ {item.price.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={styles.priceLabel}>Costo Taller</Text>
            <Text style={styles.costValue}>S/ {item.cost.toFixed(2)}</Text>
          </View>

          {/* Stock Badge and Stepper */}
          <View style={styles.stockCol}>
            <View style={[styles.stockBadge, isLowStock && styles.stockBadgeLow]}>
              <Text style={[styles.stockBadgeText, isLowStock && styles.stockBadgeTextLow]}>
                {item.stock} en stock
              </Text>
            </View>

            <View style={styles.stockControls}>
              <Pressable
                style={styles.stockBtn}
                onPress={() => handleUpdateStock(item, -1)}
                disabled={item.stock <= 0}
              >
                <MaterialCommunityIcons name="minus" size={16} color={colors.primary} />
              </Pressable>
              <Pressable
                style={styles.stockBtn}
                onPress={() => handleUpdateStock(item, 1)}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Card Actions */}
        <View style={styles.cardActionsRow}>
          <View style={styles.spacer} />
          <Pressable
            style={styles.actionBtn}
            onPress={() => openEditProductModal(item)}
            hitSlop={8}
            android_ripple={{ color: colors.ripple, borderless: true, radius: 20 }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            style={styles.actionBtn}
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
        <Text style={styles.screenTitle}>Catálogo e Inventario</Text>
      </View>

      {/* Search Bar M3 */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por repuesto, código, categoría..."
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

      {/* Categories Filter Chips */}
      <View style={styles.categoriesScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
          <Pressable
            style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
              Todas
            </Text>
          </Pressable>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.listContainer}>
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon="package-variant-closed"
            title="No se encontraron repuestos"
            description={
              searchQuery
                ? `No hay coincidencias para "${searchQuery}".`
                : 'Añade repuestos o insumos al catálogo de taller.'
            }
            ctaLabel={searchQuery ? 'Limpiar búsqueda' : 'Nuevo Producto'}
            onCta={searchQuery ? () => setSearchQuery('') : openNewProductModal}
          />
        ) : (
          <FlashList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProductCard}
            estimatedItemSize={170}
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
          label="Nuevo Repuesto"
          icon="plus"
          onPress={openNewProductModal}
        />
      </View>

      {/* Create / Edit BottomSheet */}
      {showModal && (
        <BottomSheet
          visible={showModal}
          title={editingProduct ? 'Editar Producto / Repuesto' : 'Nuevo Producto / Repuesto'}
          onClose={() => setShowModal(false)}
          footer={
            <Pressable
              style={styles.saveBtn}
              onPress={handleSaveProduct}
              disabled={saving}
              android_ripple={{ color: colors.rippleOnPrimary }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingProduct ? 'Guardar Cambios' : 'Registrar en Catálogo'}
                </Text>
              )}
            </Pressable>
          }
        >
          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
            <M3TextField
              label="Nombre del repuesto / producto *"
              placeholder="Ej: Bomba de desagüe Lavadora LG"
              value={formData.name}
              onChangeText={(text) => setFormData((p) => ({ ...p, name: text }))}
              error={formErrors.name}
              leadingIcon="tag-outline"
            />

            <M3TextField
              label="Categoría *"
              placeholder="Ej: Lavadoras, Refrigeración, Audio..."
              value={formData.category}
              onChangeText={(text) => setFormData((p) => ({ ...p, category: text }))}
              error={formErrors.category}
              leadingIcon="shape-outline"
            />

            <View style={styles.inputRow}>
              <M3TextField
                containerStyle={styles.halfInput}
                label="Precio de Venta (S/) *"
                placeholder="0.00"
                value={priceText}
                onChangeText={setPriceText}
                keyboardType="decimal-pad"
                error={formErrors.price}
                leadingIcon="cash"
              />
              <M3TextField
                containerStyle={styles.halfInput}
                label="Costo Taller (S/) *"
                placeholder="0.00"
                value={costText}
                onChangeText={setCostText}
                keyboardType="decimal-pad"
                error={formErrors.cost}
                leadingText="S/"
              />
            </View>

            <M3TextField
              label="Stock Inicial *"
              placeholder="0"
              value={stockText}
              onChangeText={setStockText}
              keyboardType="numeric"
              error={formErrors.stock}
              leadingIcon="numeric"
            />

            <M3TextField
              label="Descripción / Compatibilidad (opcional)"
              placeholder="Modelos compatibles, especificaciones..."
              value={formData.description || ''}
              onChangeText={(text) => setFormData((p) => ({ ...p, description: text }))}
              multiline
              numberOfLines={2}
              leadingIcon="format-text"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Producto Activo en Catálogo</Text>
                <Text style={styles.switchDesc}>Disponible para ventas y presupuestos.</Text>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(val) => setFormData((p) => ({ ...p, isActive: val }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={formData.isActive ? colors.onPrimary : colors.surface}
              />
            </View>
          </ScrollView>
        </BottomSheet>
      )}

      {/* Delete Confirmation Dialog */}
      {toDelete && (
        <ConfirmDialog
          visible={Boolean(toDelete)}
          title="Eliminar Repuesto"
          message={`¿Confirma que desea eliminar "${toDelete.name}" del catálogo?`}
          confirmLabel="Eliminar"
          onConfirm={handleDeleteProduct}
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

const createStyles = (colors: any) => StyleSheet.create({
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
  categoriesScrollWrapper: {
    marginVertical: spacing.xs,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  productCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  categoryChipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  productName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  productDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontSize: 11,
  },
  priceValue: {
    ...typography.titleLarge,
    color: colors.primary,
    fontWeight: '700',
  },
  costValue: {
    ...typography.titleSmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  stockCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stockBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  stockBadgeLow: {
    backgroundColor: colors.dangerSoft,
  },
  stockBadgeText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  stockBadgeTextLow: {
    color: colors.danger,
  },
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  actionBtn: {
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
    maxHeight: 440,
    paddingVertical: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  switchInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  switchTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  switchDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
    color: colors.onPrimary,
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
