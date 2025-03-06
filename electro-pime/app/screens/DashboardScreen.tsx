import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const DashboardScreen = () => {
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('day');
  
  // Mock data for dashboard
  const dashboardData = {
    metrics: {
      pendingOrders: 12,
      salesTotal: 2850,
      incomesTotal: 3450,
      expensesTotal: 980,
    },
    alerts: [
      {
        id: '1',
        type: 'inventory',
        message: 'Pantalla iPhone 13 tiene stock bajo (2 unidades)',
        priority: 'high',
        time: '1h',
      },
      {
        id: '2',
        type: 'order',
        message: 'Reparación urgente pendiente: Miguel Ángel (iPhone 12)',
        priority: 'high',
        time: '3h',
      },
      {
        id: '3',
        type: 'payment',
        message: 'Factura #F-2023-089 vencida hace 2 días',
        priority: 'medium',
        time: '12h',
      },
      {
        id: '4',
        type: 'inventory',
        message: 'Batería Samsung S21 por debajo del stock mínimo',
        priority: 'medium',
        time: '1d',
      },
    ],
    recentOrders: [
      {
        id: '1',
        customer: 'Carlos Rodríguez',
        device: 'iPhone 12 Pro',
        service: 'Cambio de pantalla',
        status: 'pending',
        date: '05/03/2024',
        priority: 'high',
        image: 'https://api.a0.dev/assets/image?text=iphone%2012%20pro%20screen%20repair&aspect=1:1&seed=123',
      },
      {
        id: '2',
        customer: 'Ana Martínez',
        device: 'Samsung S21',
        service: 'Cambio de batería',
        status: 'in_progress',
        date: '04/03/2024',
        priority: 'medium',
        image: 'https://api.a0.dev/assets/image?text=samsung%20s21%20battery%20replacement&aspect=1:1&seed=456',
      },
      {
        id: '3',
        customer: 'Pablo Gómez',
        device: 'Xiaomi Redmi Note 11',
        service: 'Reparación de puerto de carga',
        status: 'completed',
        date: '03/03/2024',
        priority: 'low',
        image: 'https://api.a0.dev/assets/image?text=xiaomi%20phone%20charging%20port%20repair&aspect=1:1&seed=789',
      },
    ],
    salesData: {
      day: {
        labels: ['9am', '12pm', '3pm', '6pm', '9pm'],
        datasets: [
          {
            data: [420, 680, 540, 790, 420],
          }
        ]
      },
      week: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
          {
            data: [1890, 2100, 1750, 2400, 2850, 1950, 1200],
          }
        ]
      },
      month: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
          {
            data: [7500, 8900, 9600, 8200],
          }
        ]
      }
    },
    servicesData: [
      {
        name: 'Pantallas',
        count: 45,
        color: '#0056b3',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Baterías',
        count: 28,
        color: '#28a745',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Software',
        count: 17,
        color: '#ffc107',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Otros',
        count: 10,
        color: '#6c757d',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }
    ]
  };

  const modules = [
    {
      id: 'orders',
      name: 'Órdenes',
      icon: 'clipboard-text',
      color: '#0056b3',
      count: 15,
    },
    {
      id: 'inventory',
      name: 'Inventario',
      icon: 'package-variant',
      color: '#28a745',
      count: 168,
    },
    {
      id: 'customers',
      name: 'Clientes',
      icon: 'account-group',
      color: '#ffc107',
      count: 87,
    },
    {
      id: 'reports',
      name: 'Reportes',
      icon: 'chart-bar',
      color: '#6c757d',
      count: null,
    },
    {
      id: 'services',
      name: 'Servicios',
      icon: 'tools',
      color: '#17a2b8',
      count: 12,
    },
    {
      id: 'schedule',
      name: 'Agenda',
      icon: 'calendar',
      color: '#dc3545',
      count: 8,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'in_progress': return '#0056b3';
      case 'completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
      default: return 'Desconocido';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return { name: 'alert-circle', color: '#dc3545' };
      case 'medium': return { name: 'alert', color: '#ffc107' };
      case 'low': return { name: 'information', color: '#17a2b8' };
      default: return { name: 'information-outline', color: '#6c757d' };
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'inventory': return { name: 'package-variant-closed-alert', color: '#ffc107' };
      case 'order': return { name: 'alert-circle', color: '#dc3545' };
      case 'payment': return { name: 'cash-alert', color: '#6c757d' };
      default: return { name: 'alert', color: '#6c757d' };
    }
  };

  const onRefresh = () => {
    setLoading(true);
    // Simulate data fetching
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerDate}>5 de Marzo, 2024</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => setShowNotifications(!showNotifications)}
        >
          <MaterialCommunityIcons name="bell-outline" size={24} color="#0056b3" />
          {dashboardData.alerts.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{dashboardData.alerts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.userAvatar}>
          <MaterialCommunityIcons name="account-circle" size={36} color="#0056b3" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsContainer}>
      <View style={styles.metricCard}>
        <View style={styles.metricIconContainer}>
          <MaterialCommunityIcons name="clipboard-text" size={24} color="#0056b3" />
        </View>
        <View style={styles.metricContent}>
          <Text style={styles.metricValue}>{dashboardData.metrics.pendingOrders}</Text>
          <Text style={styles.metricLabel}>Órdenes Pendientes</Text>
        </View>
      </View>

      <View style={styles.metricCard}>
        <View style={[styles.metricIconContainer, {backgroundColor: 'rgba(40, 167, 69, 0.12)'}]}>
          <MaterialCommunityIcons name="cash-multiple" size={24} color="#28a745" />
        </View>
        <View style={styles.metricContent}>
          <Text style={styles.metricValue}>${dashboardData.metrics.salesTotal}</Text>
          <Text style={styles.metricLabel}>Ventas Hoy</Text>
        </View>
      </View>

      <View style={styles.metricCard}>
        <View style={[styles.metricIconContainer, {backgroundColor: 'rgba(0, 123, 255, 0.12)'}]}>
          <MaterialCommunityIcons name="trending-up" size={24} color="#007bff" />
        </View>
        <View style={styles.metricContent}>
          <Text style={styles.metricValue}>${dashboardData.metrics.incomesTotal}</Text>
          <Text style={styles.metricLabel}>Ingresos</Text>
        </View>
      </View>

      <View style={styles.metricCard}>
        <View style={[styles.metricIconContainer, {backgroundColor: 'rgba(220, 53, 69, 0.12)'}]}>
          <MaterialCommunityIcons name="trending-down" size={24} color="#dc3545" />
        </View>
        <View style={styles.metricContent}>
          <Text style={styles.metricValue}>${dashboardData.metrics.expensesTotal}</Text>
          <Text style={styles.metricLabel}>Gastos</Text>
        </View>
      </View>
    </View>
  );

  const renderModules = () => (
    <View style={styles.modulesContainer}>
      <View style={styles.modulesGridContainer}>
        {modules.map((module) => (
          <TouchableOpacity 
            key={module.id} 
            style={styles.moduleCard}
            onPress={() => {/* Navegación a módulo */}}
          >
            <View style={[styles.moduleIconContainer, {backgroundColor: module.color}]}>
              <MaterialCommunityIcons name={module.icon} size={24} color="white" />
            </View>
            <Text style={styles.moduleName}>{module.name}</Text>
            {module.count !== null && (
              <View style={styles.moduleCountBadge}>
                <Text style={styles.moduleCountText}>{module.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.alertsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alertas</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>Ver Todas</Text>
        </TouchableOpacity>
      </View>

      {dashboardData.alerts.map((alert) => (
        <TouchableOpacity key={alert.id} style={styles.alertCard}>
          <View style={[styles.alertIconContainer, {backgroundColor: `${getAlertIcon(alert.type).color}20`}]}>
            <MaterialCommunityIcons 
              name={getAlertIcon(alert.type).name} 
              size={24} 
              color={getAlertIcon(alert.type).color} 
            />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <Text style={styles.alertTime}>Hace {alert.time}</Text>
          </View>
          <View style={styles.alertActionContainer}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#6c757d" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecentOrders = () => (
    <View style={styles.recentOrdersContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Órdenes Recientes</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>Ver Todas</Text>
        </TouchableOpacity>
      </View>

      {dashboardData.recentOrders.map((order) => (
        <TouchableOpacity key={order.id} style={styles.orderCard}>
          <Image 
            source={{ uri: order.image }} 
            style={styles.orderImage} 
            resizeMode="cover"
          />
          <View style={styles.orderContent}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderCustomer}>{order.customer}</Text>
              <MaterialCommunityIcons 
                name={getPriorityIcon(order.priority).name} 
                size={16} 
                color={getPriorityIcon(order.priority).color} 
              />
            </View>
            <Text style={styles.orderDevice}>{order.device}</Text>
            <Text style={styles.orderService}>{order.service}</Text>
            <View style={styles.orderFooter}>
              <View style={[styles.orderStatus, {backgroundColor: `${getStatusColor(order.status)}20`}]}>
                <Text style={[styles.orderStatusText, {color: getStatusColor(order.status)}]}>
                  {getStatusText(order.status)}
                </Text>
              </View>
              <Text style={styles.orderDate}>{order.date}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCharts = () => (
    <View style={styles.chartsContainer}>
      {/* Sales Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Ventas</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity 
              style={[styles.chartTab, activeTab === 'day' && styles.chartTabActive]}
              onPress={() => setActiveTab('day')}
            >
              <Text style={[styles.chartTabText, activeTab === 'day' && styles.chartTabTextActive]}>Día</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.chartTab, activeTab === 'week' && styles.chartTabActive]}
              onPress={() => setActiveTab('week')}
            >
              <Text style={[styles.chartTabText, activeTab === 'week' && styles.chartTabTextActive]}>Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.chartTab, activeTab === 'month' && styles.chartTabActive]}
              onPress={() => setActiveTab('month')}
            >
              <Text style={[styles.chartTabText, activeTab === 'month' && styles.chartTabTextActive]}>Mes</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <LineChart
          data={dashboardData.salesData[activeTab]}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 86, 179, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#0056b3'
            },
            propsForBackgroundLines: {
              strokeDasharray: '', // Solid background lines
            },
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Service Distribution Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Distribución de Servicios</Text>
        <PieChart
          data={dashboardData.servicesData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.notificationsPanel}>
      <View style={styles.notificationsHeader}>
        <Text style={styles.notificationsTitle}>Notificaciones</Text>
        <TouchableOpacity onPress={() => setShowNotifications(false)}>
          <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.notificationsList}>
        {dashboardData.alerts.map((alert) => (
          <TouchableOpacity key={alert.id} style={styles.notificationItem}>
            <View style={[styles.notificationIcon, {backgroundColor: `${getAlertIcon(alert.type).color}20`}]}>
              <MaterialCommunityIcons 
                name={getAlertIcon(alert.type).name} 
                size={20} 
                color={getAlertIcon(alert.type).color} 
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationMessage}>{alert.message}</Text>
              <Text style={styles.notificationTime}>Hace {alert.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#0056b3']} />
        }
      >
        {renderMetrics()}
        {renderModules()}
        {renderAlerts()}
        {renderRecentOrders()}
        {renderCharts()}
      </ScrollView>
      
      {showNotifications && renderNotifications()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  headerDate: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userAvatar: {
    padding: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 86, 179, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  modulesContainer: {
    padding: 16,
  },
  modulesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  moduleCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  moduleCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  sectionLink: {
    fontSize: 14,
    color: '#0056b3',
    fontWeight: '500',
  },
  alertsContainer: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  alertActionContainer: {
    padding: 8,
  },
  recentOrdersContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  orderContent: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  orderDevice: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  orderService: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  chartsContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  chartTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
  },
  chartTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartTabActive: {
    backgroundColor: '#0056b3',
  },
  chartTabText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  chartTabTextActive: {
    color: 'white',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  notificationsPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6c757d',
  },
});

export default DashboardScreen;