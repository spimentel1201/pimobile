import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const ProductsScreen = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'screens', name: 'Pantallas' },
    { id: 'batteries', name: 'Baterías' },
    { id: 'chargers', name: 'Cargadores' },
    { id: 'accessories', name: 'Accesorios' },
  ];

  const products = [
    {
      id: '1',
      name: 'Pantalla iPhone 13',
      category: 'screens',
      price: 150,
      stock: 5,
      minStock: 3,
      image: 'https://api.a0.dev/assets/image?text=iphone%2013%20screen%20repair%20part&aspect=1:1',
      priceHistory: [
        { date: '2024-01', price: 140 },
        { date: '2024-02', price: 145 },
        { date: '2024-03', price: 150 },
      ],
    },
    {
      id: '2',
      name: 'Batería Samsung S21',
      category: 'batteries',
      price: 45,
      stock: 8,
      minStock: 5,
      image: 'https://api.a0.dev/assets/image?text=samsung%20s21%20battery&aspect=1:1',
      priceHistory: [
        { date: '2024-01', price: 40 },
        { date: '2024-02', price: 42 },
        { date: '2024-03', price: 45 },
      ],
    },
  ];

  const ProductForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      category: '',
      price: '',
      stock: '',
      minStock: '',
    });

    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Nuevo Producto</Text>
          <TouchableOpacity 
            onPress={() => setShowAddProduct(false)}
            style={styles.closeButton}
          >
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.formScroll}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nombre del Producto</Text>
            <TextInput
              style={styles.formInput}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Ingrese nombre del producto"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Categoría</Text>
            <View style={styles.categorySelector}>
              {categories.filter(cat => cat.id !== 'all').map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    formData.category === category.id && styles.categoryOptionSelected
                  ]}
                  onPress={() => setFormData({...formData, category: category.id})}
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
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Precio</Text>
            <TextInput
              style={styles.formInput}
              value={formData.price}
              onChangeText={(text) => setFormData({...formData, price: text})}
              placeholder="Ingrese precio"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.formLabel}>Stock Inicial</Text>
              <TextInput
                style={styles.formInput}
                value={formData.stock}
                onChangeText={(text) => setFormData({...formData, stock: text})}
                placeholder="Cantidad"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.formLabel}>Stock Mínimo</Text>
              <TextInput
                style={styles.formInput}
                value={formData.minStock}
                onChangeText={(text) => setFormData({...formData, minStock: text})}
                placeholder="Mínimo"
                keyboardType="numeric"
              />
            </View>
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
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddProduct(true)}>
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.addButtonText}>Nuevo Producto</Text>
        </TouchableOpacity>
      </View>
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
        style={styles.filterButton}
        onPress={() => {}}>
        <MaterialCommunityIcons name="filter-variant" size={24} color="#0056b3" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.viewModeButton}
        onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
        <MaterialCommunityIcons
          name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
          size={24}
          color="#0056b3"
        />
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(category.id)}>
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.categoryChipTextActive,
            ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderProductCard = (product) => (
    <TouchableOpacity
      key={product.id}
      style={[
        styles.productCard,
        viewMode === 'list' && styles.productCardList,
      ]}>
      <Image
        source={{ uri: product.image }}
        style={[
          styles.productImage,
          viewMode === 'list' && styles.productImageList,
        ]}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>${product.price}</Text>
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
            ]}>
            Stock: {product.stock}
          </Text>
        </View>
      </View>
      {viewMode === 'list' && (
        <View style={styles.listActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="pencil" size={20} color="#0056b3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="history" size={20} color="#0056b3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="delete" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPriceHistory = () => {
    const data = {
      labels: products[0].priceHistory.map(h => h.date),
      datasets: [{
        data: products[0].priceHistory.map(h => h.price),
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Historial de Precios</Text>
        <LineChart
          data={data}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 86, 179, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {showAddProduct ? (
        <ProductForm />
      ) : (
        <>
          {renderSearch()}
          {renderCategories()}
          <ScrollView style={styles.productsList}>
            <View style={[
              styles.productsGrid,
              viewMode === 'list' && styles.productsList
            ]}>
              {products.map(renderProductCard)}
            </View>
            {renderPriceHistory()}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  categoriesContainer: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#0056b3',
  },
  categoryChipText: {
    color: '#495057',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  productCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    margin: '1%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  productCardList: {
    width: '98%',
    flexDirection: 'row',
    padding: 8,
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  productImageList: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    padding: 12,
    flex: 1,
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
  chartContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
  },
  formScroll: {
    flex: 1,
    padding: 16,
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
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryOptionSelected: {
    backgroundColor: '#0056b3',
    borderColor: '#0056b3',
  },
  categoryOptionText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#0056b3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductsScreen;