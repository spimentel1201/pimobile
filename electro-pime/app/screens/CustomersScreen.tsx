import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Dimensions,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photo: string;
  status: 'active' | 'inactive';
  lastOrder: string;
  totalOrders: number;
  totalSpent: number;
}

const CustomersScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '612345678',
      address: 'Calle Principal 123',
      photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Juan',
      status: 'active',
      lastOrder: '2024-01-15',
      totalOrders: 5,
      totalSpent: 850,
    },
    // Add more mock customers...
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Clientes</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddCustomer(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
        <Text style={styles.addButtonText}>Nuevo Cliente</Text>
      </TouchableOpacity>
    </View>
  );
  const renderMetrics = () => (
    <View style={styles.metricsContainer}>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>152</Text>
          <Text style={styles.metricLabel}>Total Clientes</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>28</Text>
          <Text style={styles.metricLabel}>Nuevos este mes</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>$12.5k</Text>
          <Text style={styles.metricLabel}>Ventas Totales</Text>
        </View>
      </View>
    </View>
  );
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={24} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar clientes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <TouchableOpacity
        style={styles.viewModeButton}
        onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
      >
        <MaterialCommunityIcons
          name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
          size={24}
          color="#0056b3"
        />
      </TouchableOpacity>
    </View>
  );

  const handleContact = (type: 'phone' | 'whatsapp' | 'email', contact: string) => {
    switch (type) {
      case 'phone':
        Linking.openURL(`tel:${contact}`);
        break;
      case 'whatsapp':
        Linking.openURL(`whatsapp://send?phone=${contact}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${contact}`);
        break;
    }
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={[styles.customerCard, viewMode === 'list' && styles.customerCardList]}
      onPress={() => setSelectedCustomer(item)}
    >
      <Image source={{ uri: item.photo }} style={styles.customerPhoto} />
      <View style={styles.customerInfo}>
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'active' ? '#28a745' : '#6c757d' }
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.customerDetail}>{item.email}</Text>
        <Text style={styles.customerDetail}>{item.phone}</Text>
        
        <View style={styles.customerStats}>
          <Text style={styles.statsText}>Órdenes: {item.totalOrders}</Text>
          <Text style={styles.statsText}>${item.totalSpent}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#28a745' }]}
            onPress={() => handleContact('phone', item.phone)}
          >
            <MaterialCommunityIcons name="phone" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#25D366' }]}
            onPress={() => handleContact('whatsapp', item.phone)}
          >
            <MaterialCommunityIcons name="whatsapp" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#0056b3' }]}
            onPress={() => handleContact('email', item.email)}
          >
            <MaterialCommunityIcons name="email" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderMetrics()}
      {renderSearchBar()}
      <FlatList
        data={mockCustomers}
        renderItem={renderCustomerCard}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render on view mode change
        contentContainerStyle={styles.customersList}
      />
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  metricsContainer: {
    backgroundColor: 'white',
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0056b3',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
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
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 8,
  },
  viewModeButton: {
    marginLeft: 12,
    padding: 8,
  },
  customersList: {
    padding: 8,
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerCardList: {
    flexDirection: 'row',
    width: '100%',
  },
  customerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 0,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  customerDetail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});

export default CustomersScreen;