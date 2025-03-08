import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface HeaderWithActionsProps {
  title: string;
  onAddPress?: () => void;
  onFilterPress?: () => void;
  showAddButton?: boolean;
  showFilterButton?: boolean;
}

export const HeaderWithActions: React.FC<HeaderWithActionsProps> = ({
  title,
  onAddPress,
  onFilterPress,
  showAddButton = true,
  showFilterButton = true,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actions}>
        {showFilterButton && (
          <TouchableOpacity style={styles.actionButton} onPress={onFilterPress}>
            <MaterialCommunityIcons name="filter-variant" size={24} color="#0056b3" />
          </TouchableOpacity>
        )}
        {showAddButton && (
          <TouchableOpacity style={[styles.actionButton, styles.addButton]} onPress={onAddPress}>
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#28a745',
  },
});