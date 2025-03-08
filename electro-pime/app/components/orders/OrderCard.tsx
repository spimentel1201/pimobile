import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RepairOrder } from '../../types/budget';

interface OrderCardProps {
  order: RepairOrder;
  onPress: (order: RepairOrder) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(order)}>
      <View style={styles.header}>
        <Text style={styles.customerName}>{order.customer.name}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>
      <Text style={styles.deviceInfo}>
        {order.device.brand} {order.device.model}
      </Text>
      <Text style={styles.issue} numberOfLines={2}>
        {order.issue}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#0056b3',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
  deviceInfo: {
    marginTop: 8,
    color: '#666',
  },
  issue: {
    marginTop: 4,
    color: '#444',
  },
});