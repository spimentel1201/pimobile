import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { User } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  CUSTOMER: 'Cliente',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#8B5CF6',
  TECHNICIAN: '#3B82F6',
  CUSTOMER: '#10B981',
};

const UsersScreen = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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

  const handleToggleStatus = async (user: User) => {
    Alert.alert(
      'Cambiar Estado',
      `¿Está seguro que desea ${user.isActive ? 'desactivar' : 'activar'} a ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.updateUser(user.id, { isActive: !user.isActive } as Partial<User>);
              Alert.alert('Éxito', 'Estado actualizado correctamente');
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo actualizar el estado');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (user: User) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Está seguro que desea eliminar a ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser(user.id);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el usuario');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery.length === 0 ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Usuarios</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{users.filter(u => u.isActive).length}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
        {['all', 'ADMIN', 'TECHNICIAN', 'CUSTOMER'].map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.roleChip,
              selectedRole === role && styles.roleChipActive,
              role !== 'all' && { borderLeftColor: ROLE_COLORS[role], borderLeftWidth: 3 }
            ]}
            onPress={() => setSelectedRole(role)}
          >
            <Text style={[
              styles.roleChipText,
              selectedRole === role && styles.roleChipTextActive
            ]}>
              {role === 'all' ? 'Todos' : ROLE_LABELS[role]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userCard, !item.isActive && styles.userCardInactive]}
      onPress={() => {
        setSelectedUser(item);
        setShowDetails(true);
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.firstName?.charAt(0)}{item.lastName?.charAt(0)}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] }]}>
          <Text style={styles.roleBadgeText}>{ROLE_LABELS[item.role]}</Text>
        </View>
      </View>

      <View style={styles.userFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>{item.isActive ? 'Activo' : 'Inactivo'}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: item.isActive ? '#F59E0B' : '#10B981' }]}
            onPress={() => handleToggleStatus(item)}
          >
            <MaterialCommunityIcons
              name={item.isActive ? "account-off" : "account-check"}
              size={18}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={() => handleDeleteUser(item)}
          >
            <MaterialCommunityIcons name="delete" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserDetails = () => {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={showDetails}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Usuario</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.profileSection}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>
                  {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                </Text>
              </View>
              <Text style={styles.profileName}>
                {selectedUser.firstName} {selectedUser.lastName}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[selectedUser.role] }]}>
                <Text style={styles.roleBadgeText}>{ROLE_LABELS[selectedUser.role]}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="email" size={20} color="#6B7280" />
                <Text style={styles.detailText}>{selectedUser.email}</Text>
              </View>
              {selectedUser.phone && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="phone" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>{selectedUser.phone}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color="#6B7280" />
                <Text style={styles.detailText}>
                  Creado: {new Date(selectedUser.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name={selectedUser.isActive ? "check-circle" : "close-circle"}
                  size={20}
                  color={selectedUser.isActive ? '#10B981' : '#EF4444'}
                />
                <Text style={styles.detailText}>
                  {selectedUser.isActive ? 'Usuario Activo' : 'Usuario Inactivo'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
      {renderHeader()}
      {renderFilters()}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={item => item.id}
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
      {renderUserDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
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
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  roleFilters: {
    flexDirection: 'row',
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  roleChipActive: {
    backgroundColor: '#3B82F6',
  },
  roleChipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  roleChipTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
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
  userCardInactive: {
    opacity: 0.7,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  largeAvatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  detailSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
  },
});

export default UsersScreen;