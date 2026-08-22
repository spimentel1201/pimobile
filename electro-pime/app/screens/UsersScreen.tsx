import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { User } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography, radii, shadows } from '../../constants/theme';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { FilterChip } from '../../components/ui/FilterChip';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  SELLER: 'Vendedor',
  CUSTOMER: 'Cliente',
};

const ROLE_BADGE_VARIANT: Record<string, 'primary' | 'info' | 'warning' | 'success'> = {
  ADMIN: 'primary',
  TECHNICIAN: 'info',
  SELLER: 'warning',
  CUSTOMER: 'success',
};

const UsersScreen = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; variant: 'danger' | 'success' | 'warning' | 'info'; onConfirm: () => void }>({ title: '', message: '', variant: 'info', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, variant: 'danger' | 'success' | 'warning' | 'info', onConfirm: () => void) => {
    setConfirmConfig({ title, message, variant, onConfirm });
    setConfirmVisible(true);
  };

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
    showConfirm(
      'Cambiar Estado',
      `¿Está seguro que desea ${user.isActive ? 'desactivar' : 'activar'} a ${user.firstName} ${user.lastName}?`,
      'warning',
      async () => {
        try {
          await api.updateUser(user.id, { isActive: !user.isActive } as Partial<User>);
          showConfirm('Éxito', 'Estado actualizado correctamente', 'success', () => {});
          fetchUsers();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'No se pudo actualizar el estado');
        }
      }
    );
  };

  const handleDeleteUser = async (user: User) => {
    showConfirm(
      'Eliminar Usuario',
      `¿Está seguro que desea eliminar a ${user.firstName} ${user.lastName}?`,
      'danger',
      async () => {
        try {
          await api.deleteUser(user.id);
          showConfirm('Éxito', 'Usuario eliminado correctamente', 'success', () => {});
          fetchUsers();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'No se pudo eliminar el usuario');
        }
      }
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
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Usuarios</Text>
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: theme.surfaceVariant }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>{users.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.surfaceVariant }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>{users.filter(u => u.isActive).length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Activos</Text>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.surfaceVariant }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar usuarios..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <MaterialCommunityIcons
            name="close-circle"
            size={20}
            color={theme.textMuted}
            onPress={() => setSearchQuery('')}
          />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
        {['all', 'ADMIN', 'TECHNICIAN', 'SELLER', 'CUSTOMER'].map((role) => (
          <FilterChip
            key={role}
            label={role === 'all' ? 'Todos' : ROLE_LABELS[role]}
            selected={selectedRole === role}
            onPress={() => setSelectedRole(role)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderUserCard = ({ item, index }: { item: User; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Card
        variant="elevated"
        padding={spacing.base}
        style={[!item.isActive && styles.userCardInactive, { marginBottom: spacing.md }]}
      >
        <View
          style={styles.userHeader}
        >
          <Avatar
            name={`${item.firstName} ${item.lastName}`}
            size={48}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {item.email}
            </Text>
          </View>
          <Badge
            label={ROLE_LABELS[item.role] || item.role}
            variant={ROLE_BADGE_VARIANT[item.role] || 'default'}
          />
        </View>

        <View style={[styles.userFooter, { borderTopColor: theme.borderLight }]}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isActive ? theme.primary : theme.error || '#EF4444' },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {item.isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <Button
              title=""
              variant={item.isActive ? 'success' : 'primary'}
              size="sm"
              onPress={() => handleToggleStatus(item)}
              icon={
                <MaterialCommunityIcons
                  name={item.isActive ? 'account-off' : 'account-check'}
                  size={18}
                  color={theme.textInverse}
                />
              }
              style={styles.actionButton}
            />
            <Button
              title=""
              variant="danger"
              size="sm"
              onPress={() => handleDeleteUser(item)}
              icon={
                <MaterialCommunityIcons name="delete" size={18} color={theme.textInverse} />
              }
              style={styles.actionButton}
            />
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderUserDetails = () => {
    if (!selectedUser) return null;

    return (
      <View
        style={[styles.modalContainer, { backgroundColor: theme.background }]}
      >
        <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Detalles del Usuario</Text>
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={theme.textSecondary}
            onPress={() => setShowDetails(false)}
          />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card variant="flat" padding={spacing.xl} style={styles.profileSection}>
            <Avatar
              name={`${selectedUser.firstName} ${selectedUser.lastName}`}
              size={80}
              style={{ marginBottom: spacing.md }}
            />
            <Text style={[styles.profileName, { color: theme.text }]}>
              {selectedUser.firstName} {selectedUser.lastName}
            </Text>
            <Badge
              label={ROLE_LABELS[selectedUser.role] || selectedUser.role}
              variant={ROLE_BADGE_VARIANT[selectedUser.role] || 'default'}
              size="md"
            />
          </Card>

          <Card variant="flat" padding={spacing.base} style={styles.detailSection}>
            <View style={[styles.detailRow, { borderBottomColor: theme.borderLight }]}>
              <MaterialCommunityIcons name="email" size={20} color={theme.textMuted} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>{selectedUser.email}</Text>
            </View>
            {selectedUser.phone && (
              <View style={[styles.detailRow, { borderBottomColor: theme.borderLight }]}>
                <MaterialCommunityIcons name="phone" size={20} color={theme.textMuted} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>{selectedUser.phone}</Text>
              </View>
            )}
            <View style={[styles.detailRow, { borderBottomColor: theme.borderLight }]}>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.textMuted} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                Creado: {new Date(selectedUser.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={selectedUser.isActive ? 'check-circle' : 'close-circle'}
                size={20}
                color={selectedUser.isActive ? theme.primary : theme.error || '#EF4444'}
              />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {selectedUser.isActive ? 'Usuario Activo' : 'Usuario Inactivo'}
              </Text>
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
        {renderHeader()}
        {renderFilters()}
        <SkeletonLoader lines={5} lineHeight={120} borderRadius={radii.lg} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          message={error}
        />
        <Button
          title="Reintentar"
          onPress={fetchUsers}
          variant="primary"
          style={{ marginTop: spacing.base }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
      {renderHeader()}
      {renderFilters()}
      <Animated.FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-group-outline"
            title="No hay usuarios"
            message="No se encontraron usuarios con los filtros aplicados"
          />
        }
      />
      {showDetails && renderUserDetails()}
      <ConfirmDialog
        visible={confirmVisible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmLabel={confirmConfig.variant === 'danger' ? 'Eliminar' : 'Aceptar'}
        onConfirm={() => { confirmConfig.onConfirm(); setConfirmVisible(false); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  header: {
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.base,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  statItem: {
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    minWidth: 80,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  filtersContainer: {
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: typography.sizes.base,
    marginLeft: spacing.sm,
  },
  roleFilters: {
    flexDirection: 'row',
  },
  listContent: {
    padding: spacing.base,
  },
  userCardInactive: {
    opacity: 0.7,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.sm,
    marginRight: spacing.xs + 2,
  },
  statusText: {
    fontSize: typography.sizes.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    paddingHorizontal: 0,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  modalContent: {
    flex: 1,
    padding: spacing.base,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  profileName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  detailSection: {},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  detailText: {
    marginLeft: spacing.md,
    fontSize: typography.sizes.sm,
  },
});

export default UsersScreen;
