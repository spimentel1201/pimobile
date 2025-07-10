import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Modal, 
  Switch, 
  ScrollView, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ImageStyle,
  Alert,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

type ProductCategory = {
  id: string;
  name: string;
};

type PriceHistory = {
  date: string;
  price: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category: string;
  isActive: boolean;
  imageUrl: string;
  priceHistory: PriceHistory[];
};

type FormData = Omit<Product, 'id' | 'priceHistory'>;

type FormErrors = {
  [key in keyof FormData]?: string;
};

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Smartphone',
    description: 'Latest model with advanced features',
    price: 699.99,
    cost: 450.00,
    stock: 50,
    minStock: 10,
    category: 'electronics',
    isActive: true,
    imageUrl: 'https://via.placeholder.com/150',
    priceHistory: [
      { date: '2023-01-01', price: 749.99 },
      { date: '2023-03-01', price: 699.99 },
    ],
  },
  {
    id: '2',
    name: 'Laptop',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    cost: 950.00,
    stock: 30,
    minStock: 5,
    category: 'computers',
    isActive: true,
    imageUrl: 'https://via.placeholder.com/150',
    priceHistory: [
      { date: '2023-01-01', price: 1399.99 },
      { date: '2023-03-01', price: 1299.99 },
    ],
  },
];

const productCategories: ProductCategory[] = [
  { id: 'electronics', name: 'Electrónica' },
  { id: 'computers', name: 'Computadoras' },
  { id: 'phones', name: 'Teléfonos' },
  { id: 'accessories', name: 'Accesorios' },
  { id: 'other', name: 'Otros' },
];

const ProductsScreen = () => {
  // State for products list and form visibility
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    category: '',
    isActive: true,
    imageUrl: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    const newErrors: FormErrors = {};
    
    // Basic validation
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (formData.price <= 0) newErrors.price = 'El precio debe ser mayor a 0';
    if (formData.cost < 0) newErrors.cost = 'El costo no puede ser negativo';
    if (formData.stock < 0) newErrors.stock = 'El stock no puede ser negativo';
    if (formData.minStock < 0) newErrors.minStock = 'El stock mínimo no puede ser negativo';
    if (!formData.category) newErrors.category = 'La categoría es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingProduct) {
      // Update existing product
      setProducts(prev => 
        prev.map(p => 
          p.id === editingProduct.id 
            ? { ...formData, id: editingProduct.id, priceHistory: editingProduct.priceHistory }
            : p
        )
      );
    } else {
      // Add new product
      const newProduct: Product = {
        ...formData,
        id: Date.now().toString(),
        priceHistory: [{ date: new Date().toISOString().split('T')[0], price: formData.price }]
      };
      setProducts(prev => [...prev, newProduct]);
    }

    // Reset form and close modal
    setFormData({
      name: '',
      description: '',
      price: 0,
      cost: 0,
      stock: 0,
      minStock: 0,
      category: '',
      isActive: true,
      imageUrl: 'https://via.placeholder.com/150',
    });
    setShowAddProduct(false);
    setEditingProduct(null);
  };

  // Handle product edit
  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      category: product.category,
      isActive: product.isActive,
      imageUrl: product.imageUrl,
    });
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  // Handle product deletion
  const handleDelete = useCallback((productId: string) => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' as const },
        {
          text: 'Eliminar',
          style: 'destructive' as const,
          onPress: () => {
            setProducts(prev => prev.filter(p => p.id !== productId));
            if (editingProduct?.id === productId) {
              setEditingProduct(null);
              setShowAddProduct(false);
            }
          },
        },
      ]
    );
  }, [editingProduct]);



  const handleNumericInputChange = (field: 'price' | 'cost' | 'stock' | 'minStock', text: string) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1]?.length > 2 && (field === 'price' || field === 'cost')) {
      return;
    }
    const value = numericValue === '' ? 0 : parseFloat(numericValue);
    handleInputChange(field, isNaN(value) ? 0 : value);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (editingProduct?.id === productId) {
      setEditingProduct(null);
      setShowAddProduct(false);
    }
  };

  // Add missing style definitions
  const formStyles = StyleSheet.create({
    formScroll: {
      flexGrow: 1,
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1,
    },
    multilineInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
  });

  const ProductForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async () => {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      
      try {
        setIsSubmitting(true);
        if (editingProduct) {
          setProducts(prev => 
            prev.map(p => 
              p.id === editingProduct.id 
                ? { ...formData, id: editingProduct.id, priceHistory: editingProduct.priceHistory }
                : p
            )
          );
        } else {
          const newProduct: Product = {
            ...formData,
            id: Date.now().toString(),
            priceHistory: [{ date: new Date().toISOString().split('T')[0], price: formData.price }]
          };
          setProducts(prev => [...prev, newProduct]);
        }
        setFormData({
          name: '',
          description: '',
          price: 0,
          cost: 0,
          stock: 0,
          minStock: 0,
          category: '',
          isActive: true,
          imageUrl: 'https://via.placeholder.com/150',
        });
        setShowAddProduct(false);
        setEditingProduct(null);
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'No se pudo guardar el producto. Por favor, intente de nuevo.');
      } finally {
        setIsSubmitting(false);
      }
    };

    const validateForm = (data: FormData): FormErrors => {
      const errors: FormErrors = {};
      if (!data.name.trim()) errors.name = 'El nombre es requerido';
      if (!data.category) errors.category = 'La categoría es requerida';
      if (isNaN(data.price) || data.price < 0) errors.price = 'Precio inválido';
      if (isNaN(data.cost) || data.cost < 0) errors.cost = 'Costo inválido';
      if (isNaN(data.stock) || data.stock < 0) errors.stock = 'Stock inválido';
      return errors;
    };

    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowAddProduct(false)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 1,
            }}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nombre del Producto *</Text>
            <TextInput
              style={[styles.formInput, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Ingrese nombre del producto"
              editable={!isSubmitting}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description Field */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Descripción</Text>
            <TextInput
              style={[
                styles.formInput, 
                { 
                  minHeight: 100,
                  textAlignVertical: 'top' 
                }, 
                errors.description && styles.inputError
              ]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Ingrese una descripción del producto"
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>

          {/* Price and Cost Row */}
          <View style={styles.row}>
            <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
              <Text style={styles.formLabel}>Precio de Venta *</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.formInput, styles.currencyInput, errors.price && styles.inputError]}
                  value={formData.price.toString()}
                  onChangeText={(text) => handleNumericInputChange('price', text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
              </View>
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
              <Text style={styles.formLabel}>Costo *</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.formInput, styles.currencyInput, errors.cost && styles.inputError]}
                  value={formData.cost.toString()}
                  onChangeText={(text) => handleNumericInputChange('cost', text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
              </View>
              {errors.cost && <Text style={styles.errorText}>{errors.cost}</Text>}
            </View>
          </View>

          {/* Stock Field */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Stock Inicial *</Text>
            <TextInput
              style={[styles.formInput, errors.stock && styles.inputError]}
              value={formData.stock.toString()}
              onChangeText={(text) => handleNumericInputChange('stock', text)}
              placeholder="0"
              keyboardType="numeric"
              editable={!isSubmitting}
            />
            {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
          </View>

          {/* Category Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Categoría *</Text>
            <View style={styles.categorySelector}>
              {productCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    formData.category === category.id && styles.categoryOptionSelected
                  ]}
                  onPress={() => handleInputChange('category', category.id)}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    formData.category === category.id && styles.categoryOptionTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Active Toggle */}
          <View style={[
            styles.formGroup, 
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 15,
            }
          ]}>
            <Text style={styles.formLabel}>Producto Activo</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => handleInputChange('isActive', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={formData.isActive ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              disabled={isSubmitting}
            />
          </View>

          {/* Image URL */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>URL de la Imagen</Text>
            <TextInput
              style={styles.formInput}
              value={formData.imageUrl}
              onChangeText={(text) => handleInputChange('imageUrl', text)}
              placeholder="https://ejemplo.com/imagen.jpg"
              keyboardType="url"
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Guardar Producto</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Productos</Text>
      <TouchableOpacity 
        onPress={() => {
          setFormData({
            name: '',
            description: '',
            price: 0,
            cost: 0,
            stock: 0,
            minStock: 0,
            category: '',
            isActive: true,
            imageUrl: '',
          });
          setErrors({});
          setEditingProduct(null);
          setShowAddProduct(true);
        }}
        style={styles.addButton}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
        <Text style={styles.addButtonText}>Nuevo Producto</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={24} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <TouchableOpacity
        style={styles.viewModeButton}
        onPress={() => setIsGridView(!isGridView)}>
        <MaterialCommunityIcons
          name={isGridView ? 'view-list' : 'view-grid'}
          size={24}
          color="#0056b3"
        />
      </TouchableOpacity>
    </View>
  );

  const renderProductCard = (product: Product) => {
    const handleEdit = () => {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        minStock: product.minStock,
        category: product.category,
        isActive: product.isActive,
        imageUrl: product.imageUrl,
      });
      setEditingProduct(product);
      setShowAddProduct(true);
    };

    const handleDelete = () => {
      Alert.alert(
        'Eliminar Producto',
        `¿Está seguro de eliminar ${product.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => {
              setProducts(prev => prev.filter(p => p.id !== product.id));
              if (editingProduct?.id === product.id) {
                setEditingProduct(null);
                setShowAddProduct(false);
              }
            },
          },
        ]
      );
    };

    return (
      <TouchableOpacity
        key={product.id}
        style={[
          styles.productCard,
          isGridView && styles.productCardGrid,
        ]}
      >
        <Image
          source={{ uri: product.imageUrl }}
          style={[
            styles.productImage,
            isGridView && styles.productImageGrid,
          ]}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          <View style={styles.stockContainer}>
            <MaterialCommunityIcons
              name="package-variant"
              size={16}
              color={product.stock <= product.minStock ? '#dc3545' : '#28a745'}
            />
            <Text
              style={[
                styles.stockText,
                { color: product.stock <= product.minStock ? '#dc3545' : '#28a745' },
              ]}
            >
              Stock: {product.stock}
            </Text>
          </View>
        </View>
        {!isGridView && (
          <View style={styles.listActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <MaterialCommunityIcons name="pencil" size={20} color="#0056b3" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <MaterialCommunityIcons name="delete" size={20} color="#dc3545" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderProductsGrid = () => (
    <FlatList
      data={filteredProducts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderProductCard(item)}
      numColumns={isGridView ? 2 : 1}
      contentContainerStyle={[
        isGridView ? styles.gridContainer : styles.listContainer,
        { paddingBottom: 20, paddingHorizontal: 8 }
      ]}
      key={isGridView ? 'grid' : 'list'}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={48} color="#bdc3c7" />
          <Text style={styles.emptyText}>No hay productos para mostrar</Text>
        </View>
      }
    />
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {showAddProduct ? (
        <Modal
          visible={showAddProduct}
          animationType="slide"
          onRequestClose={() => setShowAddProduct(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ProductForm />
            </View>
          </View>
        </Modal>
      ) : (
        <>
          {renderSearch()}
          {renderProductsGrid()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
  },
  
  // Grid/List styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  listContainer: {
    padding: 8,
  },
  flatListContent: {
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
  },
  viewModeButton: {
    padding: 8,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  productCardGrid: {
    width: '48%',
    margin: '1%',
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  productImageGrid: {
    height: 100,
  },
  productInfo: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 8,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 10,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formHeader: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    color: '#6c757d',
  },
  currencyInput: {
    paddingLeft: 30,
  },
  
  // Category Selector
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: '#0056b3',
    borderColor: '#0056b3',
  },
  categoryOptionText: {
    color: '#495057',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: 'white',
  },
  
  // Form Actions
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
  },
  cancelButtonText: {
    color: '#495057',
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0056b3',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Buttons
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0056b3',
    padding: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  
  // Status Badge
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusActive: {
    backgroundColor: '#d4edda',
  },
  statusInactive: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#155724',
  },
  statusTextInactive: {
    color: '#721c24',
  },
});

export default ProductsScreen;