import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

interface Technician {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
}

interface Device {
  brand: string;
  model: string;
  serialNumber?: string;
  issue: string;
  condition: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Order {
  id: string;
  customer: Customer;
  device: Device;
  technician?: Technician;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered';
  createdAt: string;
  updatedAt: string;
  estimatedCost?: number;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
}

// Add this before the OrdersScreen component
interface NewOrderFormProps {
  onClose: () => void;
  editingOrder: Order | null;
}

const OrdersScreen = () => {
  // Add this after the interfaces and before the OrdersScreen component
  const mockOrders: Order[] = [
    {
      id: 'ORD-001',
      customer: {
        id: 'C1',
        name: 'Juan Pérez',
        phone: '612345678',
        email: 'juan@example.com'
      },
      device: {
        brand: 'Samsung',
        model: 'TV LED 55"',
        serialNumber: 'SN123456',
        issue: 'No enciende',
        condition: 'Usado'
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priority: 'high'
    },
    {
      id: 'ORD-002',
      customer: {
        id: 'C2',
        name: 'María García',
        phone: '623456789',
        email: 'maria@example.com'
      },
      device: {
        brand: 'LG',
        model: 'Refrigerador',
        serialNumber: 'LG789012',
        issue: 'No enfría',
        condition: 'Usado'
      },
      technician: {
        id: 'T1',
        name: 'Carlos Técnico',
        specialty: 'Refrigeración',
        available: true
      },
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priority: 'medium'
    }
  ];
  
  // Update the useState initialization for orders
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all');
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Órdenes</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowNewOrder(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
        <Text style={styles.addButtonText}>Nueva Orden</Text>
      </TouchableOpacity>
    </View>
  );
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['all', 'pending', 'in_progress', 'completed', 'delivered'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filterStatus === status && styles.filterChipActive
            ]}
            onPress={() => setFilterStatus(status as typeof filterStatus)}
          >
            <Text style={[
              styles.filterChipText,
              filterStatus === status && styles.filterChipTextActive
            ]}>
              {status === 'all' ? 'Todas' : 
               status === 'pending' ? 'Pendientes' :
               status === 'in_progress' ? 'En Progreso' :
               status === 'completed' ? 'Completadas' : 'Entregadas'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowOrderDetails(true);
      }}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{item.id}</Text>
          <Text style={styles.orderCustomer}>{item.customer.name}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'pending' ? '#ffc107' :
                           item.status === 'in_progress' ? '#0056b3' :
                           item.status === 'completed' ? '#28a745' : '#6c757d' }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'pending' ? 'Pendiente' :
             item.status === 'in_progress' ? 'En Progreso' :
             item.status === 'completed' ? 'Completado' : 'Entregado'}
          </Text>
        </View>
      </View>
      <View style={styles.deviceInfo}>
        <MaterialCommunityIcons name="television" size={20} color="#6c757d" />
        <Text style={styles.deviceText}>
          {item.device.brand} {item.device.model}
        </Text>
      </View>
      <View style={styles.orderFooter}>
        <View style={styles.technicianInfo}>
          {item.technician ? (
            <>
              <MaterialCommunityIcons name="account-wrench" size={20} color="#0056b3" />
              <Text style={styles.technicianName}>{item.technician.name}</Text>
            </>
          ) : (
            <Text style={styles.noTechnician}>Sin técnico asignado</Text>
          )}
        </View>
        <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.orderActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#0056b3' }]}
          onPress={() => {
            setSelectedOrder(item);
            setShowNewOrder(true);
          }}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#28a745' }]}
          onPress={() => {
            Alert.alert(
              'Notificar Cliente',
              '¿Desea enviar una notificación al cliente?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel'
                },
                {
                  text: 'Notificar',
                  onPress: () => {
                    // TODO: Implement customer notification logic
                    Alert.alert('Éxito', 'Cliente notificado exitosamente');
                  }
                }
              ]
            );
          }}
        >
          <MaterialCommunityIcons name="bell" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#ffc107' }]}
          onPress={() => {
            Alert.alert(
              'Generar Presupuesto',
              '¿Desea generar un presupuesto para esta orden?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel'
                },
                {
                  text: 'Generar',
                  onPress: () => {
                    // TODO: Implement estimate generation logic
                    Alert.alert('Éxito', 'Presupuesto generado exitosamente');
                  }
                }
              ]
            );
          }}
        >
          <MaterialCommunityIcons name="file-document" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      <FlatList
        data={filterStatus === 'all' ? orders : orders.filter(order => order.status === filterStatus)}
        renderItem={renderOrderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.ordersList}
      />
      <Modal
        visible={showNewOrder}
        animationType="slide"
        onRequestClose={() => setShowNewOrder(false)}
      >
        <NewOrderForm 
          onClose={() => setShowNewOrder(false)}
          editingOrder={selectedOrder}
        />
      </Modal>

      <Modal
        visible={showOrderDetails}
        animationType="slide" 
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <View style={styles.container}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#e9ecef'
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#0056b3'
            }}>Orden #{selectedOrder?.id}</Text>
            <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{padding: 16}}>
            <View style={{
              marginBottom: 24,
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#0056b3',
                marginBottom: 8
              }}>Estado</Text>
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: selectedOrder?.status === 'pending' ? '#ffc107' :
                                 selectedOrder?.status === 'in_progress' ? '#0056b3' :
                                 selectedOrder?.status === 'completed' ? '#28a745' : '#6c757d',
                  alignSelf: 'flex-start',
                  marginTop: 8
                }
              ]}>
                <Text style={styles.statusText}>
                  {selectedOrder?.status === 'pending' ? 'Pendiente' :
                   selectedOrder?.status === 'in_progress' ? 'En Progreso' :
                   selectedOrder?.status === 'completed' ? 'Completado' : 'Entregado'}
                </Text>
              </View>
            </View>

            <View style={{
              marginBottom: 24,
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#0056b3',
                marginBottom: 8
              }}>Cliente</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <MaterialCommunityIcons name="account" size={20} color="#6c757d" />
                <Text style={{
                  marginLeft: 8,
                  color: '#495057',
                  fontSize: 14
                }}>{selectedOrder?.customer.name}</Text>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <MaterialCommunityIcons name="phone" size={20} color="#6c757d" />
                <Text style={{
                  marginLeft: 8,
                  color: '#495057',
                  fontSize: 14
                }}>{selectedOrder?.customer.phone}</Text>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <MaterialCommunityIcons name="email" size={20} color="#6c757d" />
                <Text style={{
                  marginLeft: 8,
                  color: '#495057',
                  fontSize: 14
                }}>{selectedOrder?.customer.email}</Text>
              </View>
            </View>

            <View style={{
              marginBottom: 24,
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#0056b3',
                marginBottom: 8
              }}>Dispositivo</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <MaterialCommunityIcons name="television" size={20} color="#6c757d" />
                <Text style={{
                  marginLeft: 8,
                  color: '#495057',
                  fontSize: 14
                }}>{selectedOrder?.device.brand} {selectedOrder?.device.model}</Text>
              </View>
              {selectedOrder?.device.serialNumber && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <MaterialCommunityIcons name="barcode" size={20} color="#6c757d" />
                  <Text style={{
                    marginLeft: 8,
                    color: '#495057',
                    fontSize: 14
                  }}>{selectedOrder.device.serialNumber}</Text>
                </View>
              )}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#6c757d" />
                <Text style={{
                  marginLeft: 8,
                  color: '#495057',
                  fontSize: 14
                }}>{selectedOrder?.device.issue}</Text>
              </View>
            </View>

            <View style={{
              marginBottom: 24,
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#0056b3',
                marginBottom: 8
              }}>Técnico Asignado</Text>
              {selectedOrder?.technician ? (
                <>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <MaterialCommunityIcons name="account-wrench" size={20} color="#6c757d" />
                    <Text style={{
                      marginLeft: 8,
                      color: '#495057',
                      fontSize: 14
                    }}>{selectedOrder.technician.name}</Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <MaterialCommunityIcons name="tools" size={20} color="#6c757d" />
                    <Text style={{
                      marginLeft: 8,
                      color: '#495057',
                      fontSize: 14
                    }}>{selectedOrder.technician.specialty}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.noTechnician}>Sin técnico asignado</Text>
              )}
            </View>

            <View style={{
              marginBottom: 24,
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#0056b3',
                marginBottom: 8
              }}>Detalles Adicionales</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <MaterialCommunityIcons name="flag" size={20} color="#6c757d" />
                <Text style={{
                  color: selectedOrder?.priority === 'high' ? '#dc3545' :
                         selectedOrder?.priority === 'medium' ? '#ffc107' : '#28a745'
                }}>
                  Prioridad {selectedOrder?.priority === 'high' ? 'Alta' :
                            selectedOrder?.priority === 'medium' ? 'Media' : 'Baja'}
                </Text>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <MaterialCommunityIcons name="calendar" size={20} color="#6c757d" />
                <Text style={{
                  marginLeft: 8,
                  color: '#495057',
                  fontSize: 14
                }}>
                  Creada el {selectedOrder && new Date(selectedOrder.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};


const NewOrderForm: React.FC<NewOrderFormProps> = ({ onClose, editingOrder }) => {
  const [formData, setFormData] = useState({
    customer: {
      name: editingOrder?.customer?.name || '',
      phone: editingOrder?.customer?.phone || '',
      email: editingOrder?.customer?.email || ''
    },
    device: {
      brand: editingOrder?.device?.brand || '',
      model: editingOrder?.device?.model || '',
      serialNumber: editingOrder?.device?.serialNumber || '',
      issue: editingOrder?.device?.issue || '',
      condition: editingOrder?.device?.condition || ''
    },
    priority: editingOrder?.priority || 'medium',
    notes: editingOrder?.notes || ''
  });

  const handleSubmit = () => {
    // TODO: Implement form submission
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#0056b3'
        }}>
          {editingOrder ? 'Editar Orden' : 'Nueva Orden'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#0056b3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#0056b3',
          marginVertical: 16,
          paddingHorizontal: 16,
        }}>Información del Cliente</Text>
        <TextInput
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#dee2e6',
            borderRadius: 8,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
            fontSize: 16,
          }}
          placeholder="Nombre del cliente"
          value={formData.customer.name}
          onChangeText={text => setFormData({
            ...formData,
            customer: { ...formData.customer, name: text }
          })}
        />
        <TextInput
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#dee2e6',
            borderRadius: 8,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
            fontSize: 16,
          }}
          placeholder="Teléfono"
          value={formData.customer.phone}
          keyboardType="phone-pad"
          onChangeText={text => setFormData({
            ...formData,
            customer: { ...formData.customer, phone: text }
          })}
        />
        <TextInput
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#dee2e6',
            borderRadius: 8,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
            fontSize: 16,
          }}
          placeholder="Email"
          value={formData.customer.email}
          keyboardType="email-address"
          onChangeText={text => setFormData({
            ...formData,
            customer: { ...formData.customer, email: text }
          })}
        />

        <Text style={{
          fontSize: 18,
          fontWeight: 'bold', 
          color: '#0056b3',
          marginVertical: 16,
          paddingHorizontal: 16,
        }}>Información del Dispositivo</Text>
        <TextInput
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#dee2e6',
            borderRadius: 8,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
            fontSize: 16,
          }}
          placeholder="Marca"
          value={formData.device.brand}
          onChangeText={text => setFormData({
            ...formData,
            device: { ...formData.device, brand: text }
          })}
        />
        <TextInput
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#dee2e6',
            borderRadius: 8,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
            fontSize: 16,
          }}
          placeholder="Modelo"
          value={formData.device.model}
          onChangeText={text => setFormData({
            ...formData,
            device: { ...formData.device, model: text }
          })}
        />
        <TextInput
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#dee2e6',
            borderRadius: 8,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
            fontSize: 16,
          }}
          placeholder="Número de Serie"
          value={formData.device.serialNumber}
          onChangeText={text => setFormData({
            ...formData,
            device: { ...formData.device, serialNumber: text }
          })}
        />
        <TextInput
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#dee2e6',
            borderRadius: 8,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
            fontSize: 16,
            height: 100,
            textAlignVertical: 'top'
          }}
          placeholder="Problema"
          value={formData.device.issue}
          multiline
          numberOfLines={3}
          onChangeText={text => setFormData({
            ...formData,
            device: { ...formData.device, issue: text }
          })}
        />

        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#0056b3',
          marginVertical: 16,
          paddingHorizontal: 16,
        }}>Prioridad</Text>
        <Picker
          selectedValue={formData.priority}
          onValueChange={value => setFormData({
            ...formData,
            priority: value
          })}
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#dee2e6',
            borderRadius: 8,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Picker.Item label="Alta" value="high" />
          <Picker.Item label="Media" value="medium" />
          <Picker.Item label="Baja" value="low" />
        </Picker>

        <TouchableOpacity 
          style={{
            backgroundColor: '#0056b3',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginHorizontal: 16,
            marginVertical: 24,
          }}
          onPress={handleSubmit}
        >
          <Text style={{color: 'white', fontSize: 16, fontWeight: '500'}}>
            {editingOrder ? 'Actualizar' : 'Crear'} Orden
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Add these styles to your StyleSheet
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
  filtersContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  filterChipActive: {
    backgroundColor: '#0056b3',
    borderColor: '#0056b3',
  },
  filterChipText: {
    color: '#495057',
  },
  filterChipTextActive: {
    color: 'white',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#212529',
    marginTop: 4,
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
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceText: {
    marginLeft: 8,
    color: '#495057',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technicianName: {
    marginLeft: 8,
    color: '#0056b3',
  },
  noTechnician: {
    color: '#6c757d',
    fontStyle: 'italic',
  },
  orderDate: {
    color: '#6c757d',
    fontSize: 12,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrdersScreen;