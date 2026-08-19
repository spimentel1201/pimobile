import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/api';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  CUSTOMER: 'Cliente',
  SELLER: 'Vendedor',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#8B5CF6',
  TECHNICIAN: '#3B82F6',
  CUSTOMER: '#10B981',
  SELLER: '#F59E0B',
};

export default function UsersScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [currentUser, fetchUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleUserPress = (user: User) => {
    Alert.alert(
      `${user.firstName} ${user.lastName}`,
      `Email: ${user.email}\nRol: ${ROLE_LABELS[user.role] || user.role}\nTeléfono: ${user.phone || 'N/A'}\nEstado: ${user.isActive ? 'Activo' : 'Inactivo'}`,
      [{ text: 'Cerrar' }]
    );
  };

  const renderItem = ({ item }: { item: User }) => {
    const roleColor = ROLE_COLORS[item.role] || '#6B7280';
    const initials = `${item.firstName?.charAt(0) || ''}${item.lastName?.charAt(0) || ''}`.toUpperCase();

    return (
      <TouchableOpacity
        style={[styles.userCard, !item.isActive && styles.userCardInactive]}
        onPress={() => handleUserPress(item)}
      >
        <View style={[styles.avatar, { backgroundColor: roleColor }]}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.roleRow}>
            <View style={[styles.userRole, { backgroundColor: `${roleColor}20` }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                {ROLE_LABELS[item.role] || item.role}
              </Text>
            </View>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>Inactivo</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#9ca3af" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with title and add button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Usuarios</Text>
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={() => router.push('/users/new' as any)}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.headerAddButtonText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {users.filter(u => u.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
            {users.filter(u => u.role === 'ADMIN').length}
          </Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-group-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay usuarios</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  headerAddButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userCardInactive: {
    opacity: 0.6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userRole: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inactiveText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  menuButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
