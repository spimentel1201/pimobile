import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NewSaleScreen from '../../components/NewSaleScreen';

// Move helper functions outside the component
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return '#28a745';
    case 'pending':
      return '#ffc107';
    case 'in_progress':
      return '#0056b3';
    default:
      return '#6c757d';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'pending':
      return 'Pendiente';
    case 'in_progress':
      return 'En Proceso';
    default:
      return 'Desconocido';
  }
};

const SalesScreen = () => {
  const [showNewSale, setShowNewSale] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  // Mock data for sales
  // Move mockSales inside the component
  const mockSales = [
    {
      number: 'VTA-001',
      status: 'completed',
      customer: 'Juan Pérez',
      date: '2024-03-15',
      total: 2500.00,
      paymentMethod: 'Efectivo',
      items: [
        { id: '1', name: 'iPhone 13 Screen', quantity: 1, price: 1500 },
        { id: '2', name: 'Screen Protector', quantity: 2, price: 500 },
      ]
    },
    {
      number: 'VTA-002',
      status: 'pending',
      customer: 'María García',
      date: '2024-03-14',
      total: 3200.00,
      paymentMethod: 'Tarjeta',
      items: [
        { id: '3', name: 'Samsung Battery', quantity: 2, price: 1200 },
        { id: '4', name: 'Charging Port', quantity: 1, price: 800 },
      ]
    },
    {
      number: 'VTA-003',
      status: 'in_progress',
      customer: 'Carlos López',
      date: '2024-03-13',
      total: 1800.00,
      paymentMethod: 'Transferencia',
      items: [
        { id: '5', name: 'LCD Screen', quantity: 1, price: 1800 },
      ]
    }
  ];

  // Calculate metrics
  const calculateMetrics = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = mockSales.filter(sale => sale.date === today);
    const monthSales = mockSales.filter(sale => {
      const saleMonth = sale.date.substring(0, 7);
      const currentMonth = today.substring(0, 7);
      return saleMonth === currentMonth;
    });
    
    return {
      dailyTotal: todaySales.reduce((sum, sale) => sum + sale.total, 0),
      monthlyTotal: monthSales.reduce((sum, sale) => sum + sale.total, 0),
      averageTicket: monthSales.length > 0 
        ? monthSales.reduce((sum, sale) => sum + sale.total, 0) / monthSales.length 
        : 0
    };
  };

  const metrics = calculateMetrics();

  // Render metrics component
  const renderMetrics = () => (
    <ScrollView horizontal style={styles.metricsContainer}>
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Ventas del Día</Text>
        <Text style={styles.metricValue}>${metrics.dailyTotal.toFixed(2)}</Text>
        <Text style={styles.metricChange}>+15.2%</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Ventas del Mes</Text>
        <Text style={styles.metricValue}>${metrics.monthlyTotal.toFixed(2)}</Text>
        <Text style={styles.metricChange}>+8.5%</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Tickets Promedio</Text>
        <Text style={styles.metricValue}>${metrics.averageTicket.toFixed(2)}</Text>
        <Text style={styles.metricChange}>+5.3%</Text>
      </View>
    </ScrollView>
  );

  // Render sale item component
  const renderSaleItem = ({ item }: { item: { 
    number: string;
    status: string;
    customer: string;
    date: string;
    total: number;
    paymentMethod: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
    }>;
  }}) => (
    <TouchableOpacity 
      style={styles.saleCard}
      onPress={() => setSelectedSale(item as any)}
    >
      <View style={styles.saleHeader}>
        <Text style={styles.saleNumber}>#{item.number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.saleInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={20} color="#6c757d" />
          <Text style={styles.customerName}>{item.customer}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={20} color="#6c757d" />
          <Text style={styles.saleDate}>{item.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="cash" size={20} color="#6c757d" />
          <Text style={styles.saleTotal}>${item.total.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="credit-card" size={20} color="#6c757d" />
          <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#0056b3' }]}
          onPress={() => {
            Alert.alert('Print Ticket', `Printing ticket for sale #${item.number}`);
          }}
        >
          <MaterialCommunityIcons name="printer" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#28a745' }]}
          onPress={() => {
            Alert.alert('Send Invoice', `Sending invoice for sale #${item.number}`);
          }}
        >
          <MaterialCommunityIcons name="email" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#ffc107' }]}
          onPress={() => {
            Alert.alert('Export Sale', `Exporting sale #${item.number}`);
          }}
        >
          <MaterialCommunityIcons name="download" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ventas</Text>
        <TouchableOpacity 
          style={styles.newSaleButton}
          onPress={() => setShowNewSale(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.newSaleButtonText}>Nueva Venta</Text>
        </TouchableOpacity>
      </View>
      
      {renderMetrics()}
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Hoy', 'Semana', 'Mes', 'Año'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.filterChip,
                dateFilter === period.toLowerCase() && styles.filterChipActive
              ]}
              onPress={() => setDateFilter(period.toLowerCase())}
            >
              <Text style={[
                styles.filterChipText,
                dateFilter === period.toLowerCase() && styles.filterChipTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={mockSales}
        renderItem={renderSaleItem}
        keyExtractor={item => item.number}
        contentContainerStyle={styles.salesList}
      />
      
      <Modal
        visible={showNewSale}
        animationType="slide"
        onRequestClose={() => setShowNewSale(false)}
        presentationStyle="fullScreen"
      >
        <NewSaleScreen onClose={() => setShowNewSale(false)} />
      </Modal>
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
  newSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newSaleButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  metricsContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    minWidth: 160,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0056b3',
  },
  filterChipText: {
    color: '#495057',
  },
  filterChipTextActive: {
    color: 'white',
  },
  salesList: {
    padding: 16,
  },
  saleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  saleInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    marginLeft: 8,
    fontSize: 16,
    color: '#212529',
  },
  saleDate: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
  },
  saleTotal: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  paymentMethod: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default SalesScreen;