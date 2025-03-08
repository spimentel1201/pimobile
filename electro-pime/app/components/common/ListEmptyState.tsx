import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ListEmptyStateProps {
  message: string;
  icon?: string;
}

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({ 
  message, 
  icon = 'clipboard-text-outline' 
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={48} color="#6c757d" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});