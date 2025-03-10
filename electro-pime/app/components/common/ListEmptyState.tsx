import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ListEmptyStateProps {
  message: string;
  icon?: string;
}

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({ 
  message, 
  icon = 'clipboard-text-outline' 
}) => {
  const [IconComponent, setIconComponent] = useState<any>(null);

  useEffect(() => {
    import('react-native-vector-icons/MaterialCommunityIcons')
      .then(module => setIconComponent(() => module.default));
  }, []);

  return (
    <View style={styles.container}>
      {IconComponent ? (
        <IconComponent name={icon} size={48} color="#6c757d" />
      ) : (
        <ActivityIndicator size="large" color="#6c757d" />
      )}
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