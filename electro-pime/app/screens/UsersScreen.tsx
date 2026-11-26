// ponytail: M3 UsersScreen with search, role filters, user details bottom sheet, and confirm dialogs.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { User } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { theme, colors, typography, spacing, radius } from '../theme';
import {
  Card,
  M3Fab,
  MetricCard,
  EmptyState,
  BottomSheet,
  ConfirmDialog,
} from '../components/ui';
import AppHeader from '../components/AppHeader';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  CUSTOMER: 'Cliente',
  SELLER: 'Vendedor',
};

const ROLE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  ADMIN: 'shield-account',
  TECHNICIAN: 'wrench',
  CUSTOMER: 'account',
  SELLER: 'tag-outline',
};

const UsersScreen = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [isDark]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Modals & Sheets
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleConfirmToggle = async () => {
    if (!userToToggle) return;
    setIsSubmitting(true);
    try {
      await api.updateUser(userToToggle.id, { isActive: !userToToggle.isActive } as Partial<User>);
      setUserToToggle(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el estado del usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await api.deleteUser(userToDelete.id);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery.length === 0 ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const techCount = users.filter((u) => u.role === 'TECHNICIAN').length;

  const renderItem = ({ item }: { item: User }) => {
    const initials = `${item.firstName?.charAt(0) || ''}${item.lastName?.charAt(0) || ''}`.toUpperCase();
    const roleIcon = ROLE_ICONS[item.role] || 'account';

    return (
      <Card
        variant="elevated"
        style={styles.userCard}
        onPress={() => {
          setSelectedUser(item);
          setShowDetails(true);
        }}
      >
        <View style={styles.cardHeader}>
          {/* Avatar with Role Pill */}
          <View style={[styles.avatar, !item.isActive && styles.avatarInactive]}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.firstName} {item.lastName}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: item.isActive ? theme.colorRoles.primaryContainer : theme.colorRoles.errorContainer },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: item.isActive ? theme.colorRoles.primary : theme.colorRoles.error },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: item.isActive ? theme.colorRoles.onPrimaryContainer : theme.colorRoles.onErrorContainer },
                  ]}
                >
                  {item.isActive ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>

            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>

            <View style={styles.roleRow}>
              <View style={styles.roleChip}>
                <MaterialCommunityIcons name={roleIcon} size={14} color={theme.colorRoles.primary} />
                <Text style={styles.roleText}>{ROLE_LABELS[item.role] || item.role}</Text>
              </View>
              {item.phone ? (
                <Text style={styles.userPhone}>
                  <MaterialCommunityIcons name="phone" size={12} color={theme.colorRoles.onSurfaceVariant} /> {item.phone}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Card Actions */}
        <View style={styles.cardFooter}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
            android_ripple={{ color: theme.colorRoles.primaryContainer }}
            onPress={() => setUserToToggle(item)}
          >
            <MaterialCommunityIcons
              name={item.isActive ? 'account-off-outline' : 'account-check-outline'}
              size={18}
              color={item.isActive ? theme.colorRoles.error : theme.colorRoles.primary}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: item.isActive ? theme.colorRoles.error : theme.colorRoles.primary },
              ]}
            >
              {item.isActive ? 'Desactivar' : 'Activar'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
            android_ripple={{ color: theme.colorRoles.errorContainer }}
            onPress={() => setUserToDelete(item)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colorRoles.error} />
            <Text style={[styles.actionButtonText, { color: theme.colorRoles.error }]}>Eliminar</Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Usuarios y Técnicos"
        subtitle={`${users.length} registrados`}
        rightAction={
          <Pressable
            style={styles.headerAddBtn}
            android_ripple={{ color: theme.colorRoles.primaryContainer, borderless: true }}
            onPress={() => {
              Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/users/new' as any);
            }}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={24} color={theme.colorRoles.primary} />
          </Pressable>
        }
      />

      {/* Metric Cards */}
      <View style={styles.metricsRow}>
        <MetricCard
          title="Total"
          value={users.length}
          icon="account-group"
          colorRole="primary"
          style={styles.metricItem}
        />
        <MetricCard
          title="Activos"
          value={activeCount}
          icon="account-check"
          colorRole="secondary"
          style={styles.metricItem}
        />
        <MetricCard
          title="Técnicos"
          value={techCount}
          icon="wrench"
          colorRole="tertiary"
          style={styles.metricItem}
        />
      </View>

      {/* M3 SearchBar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colorRoles.onSurfaceVariant} />
          <Text
            style={[styles.searchPlaceholder, searchQuery ? styles.searchActiveText : null]}
            numberOfLines={1}
          >
            {searchQuery || 'Buscar por nombre o correo...'}
          </Text>
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.colorRoles.onSurfaceVariant} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Horizontal Role Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {[
            { id: 'all', label: 'Todos', count: users.length },
            { id: 'ADMIN', label: 'Administradores', count: adminCount },
            { id: 'TECHNICIAN', label: 'Técnicos', count: techCount },
            { id: 'CUSTOMER', label: 'Clientes', count: users.filter((u) => u.role === 'CUSTOMER').length },
          ].map((chip) => {
            const isSelected = selectedRole === chip.id;
            return (
              <Pressable
                key={chip.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                android_ripple={{ color: theme.colorRoles.primaryContainer }}
                onPress={() => {
                  Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedRole(chip.id);
                }}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {chip.label} ({chip.count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* User List */}
      <View style={styles.listContainer}>
        <FlashList
          data={filteredUsers}
          renderItem={renderItem}
          estimatedItemSize={140}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colorRoles.primary]}
              tintColor={theme.colorRoles.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="account-group-outline"
              title="No hay usuarios"
              description={searchQuery ? 'Ningún usuario coincide con la búsqueda' : 'Registra el primer técnico o usuario'}
              actionLabel="Nuevo Usuario"
              onAction={() => router.push('/users/new' as any)}
            />
          }
        />
      </View>

      {/* Extended FAB */}
      <M3Fab
        label="Nuevo Usuario"
        icon="account-plus"
        onPress={() => {
          Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/users/new' as any);
        }}
      />

      {/* User Details BottomSheet */}
      <BottomSheet
        visible={showDetails}
        onClose={() => setShowDetails(false)}
        title="Detalles del Usuario"
      >
        {selectedUser && (
          <View style={styles.sheetDetails}>
            <View style={styles.sheetAvatarHeader}>
              <View style={styles.sheetLargeAvatar}>
                <Text style={styles.sheetLargeAvatarText}>
                  {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                </Text>
              </View>
              <Text style={styles.sheetUserName}>
                {selectedUser.firstName} {selectedUser.lastName}
              </Text>
              <View style={styles.sheetRolePill}>
                <MaterialCommunityIcons
                  name={ROLE_ICONS[selectedUser.role] || 'account'}
                  size={16}
                  color={theme.colorRoles.primary}
                />
                <Text style={styles.sheetRoleText}>{ROLE_LABELS[selectedUser.role] || selectedUser.role}</Text>
              </View>
            </View>

            <View style={styles.sheetInfoList}>
              <View style={styles.sheetInfoRow}>
                <MaterialCommunityIcons name="email-outline" size={20} color={theme.colorRoles.onSurfaceVariant} />
                <View style={styles.sheetInfoTexts}>
                  <Text style={styles.sheetInfoLabel}>Correo electrónico</Text>
                  <Text style={styles.sheetInfoValue}>{selectedUser.email}</Text>
                </View>
              </View>

              <View style={styles.sheetInfoRow}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={theme.colorRoles.onSurfaceVariant} />
                <View style={styles.sheetInfoTexts}>
                  <Text style={styles.sheetInfoLabel}>Teléfono</Text>
                  <Text style={styles.sheetInfoValue}>{selectedUser.phone || 'No registrado'}</Text>
                </View>
              </View>

              <View style={styles.sheetInfoRow}>
                <MaterialCommunityIcons
                  name={selectedUser.isActive ? 'check-circle-outline' : 'close-circle-outline'}
                  size={20}
                  color={selectedUser.isActive ? theme.colorRoles.primary : theme.colorRoles.error}
                />
                <View style={styles.sheetInfoTexts}>
                  <Text style={styles.sheetInfoLabel}>Estado de cuenta</Text>
                  <Text style={[styles.sheetInfoValue, { color: selectedUser.isActive ? theme.colorRoles.primary : theme.colorRoles.error }]}>
                    {selectedUser.isActive ? 'Activo en el sistema' : 'Acceso deshabilitado'}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetInfoRow}>
                <MaterialCommunityIcons name="calendar-clock-outline" size={20} color={theme.colorRoles.onSurfaceVariant} />
                <View style={styles.sheetInfoTexts}>
                  <Text style={styles.sheetInfoLabel}>Fecha de registro</Text>
                  <Text style={styles.sheetInfoValue}>
                    {new Date(selectedUser.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </BottomSheet>

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        visible={!!userToToggle}
        title={userToToggle?.isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
        message={`¿Estás seguro de que deseas ${userToToggle?.isActive ? 'desactivar el acceso a' : 'reactivar a'} ${userToToggle?.firstName} ${userToToggle?.lastName}?`}
        confirmLabel={userToToggle?.isActive ? 'Desactivar' : 'Activar'}
        destructive={Boolean(userToToggle?.isActive)}
        onConfirm={handleConfirmToggle}
        onCancel={() => setUserToToggle(null)}
      />

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        visible={!!userToDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar permanentemente a ${userToDelete?.firstName} ${userToDelete?.lastName}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorRoles.surface,
  },
  headerAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  metricItem: {
    flex: 1,
  },
  searchBarWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colorRoles.surfaceContainerHigh,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    ...typography.bodyMedium,
    color: theme.colorRoles.onSurfaceVariant,
  },
  searchActiveText: {
    color: theme.colorRoles.onSurface,
  },
  filtersWrapper: {
    paddingVertical: spacing.sm,
  },
  filterChipsRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: theme.colorRoles.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colorRoles.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: theme.colorRoles.primaryContainer,
    borderColor: theme.colorRoles.primary,
  },
  filterChipText: {
    ...typography.labelMedium,
    color: theme.colorRoles.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: theme.colorRoles.onPrimaryContainer,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 96,
  },
  userCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: theme.colorRoles.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInactive: {
    backgroundColor: theme.colorRoles.surfaceContainerHighest,
  },
  avatarText: {
    ...typography.titleMedium,
    color: theme.colorRoles.primary,
    fontWeight: '700',
  },
  cardMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    ...typography.titleMedium,
    color: theme.colorRoles.onSurface,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  userEmail: {
    ...typography.bodyMedium,
    color: theme.colorRoles.onSurfaceVariant,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colorRoles.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    gap: 4,
  },
  roleText: {
    ...typography.labelSmall,
    color: theme.colorRoles.onSurface,
    fontWeight: '600',
  },
  userPhone: {
    ...typography.bodySmall,
    color: theme.colorRoles.onSurfaceVariant,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colorRoles.outlineVariant,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  actionButtonText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  sheetDetails: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  sheetAvatarHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetLargeAvatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: theme.colorRoles.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sheetLargeAvatarText: {
    ...typography.headlineMedium,
    color: theme.colorRoles.primary,
    fontWeight: '700',
  },
  sheetUserName: {
    ...typography.titleLarge,
    color: theme.colorRoles.onSurface,
    fontWeight: '700',
  },
  sheetRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colorRoles.surfaceContainerHighest,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
    marginTop: 6,
  },
  sheetRoleText: {
    ...typography.labelMedium,
    color: theme.colorRoles.primary,
    fontWeight: '600',
  },
  sheetInfoList: {
    gap: spacing.md,
  },
  sheetInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  sheetInfoTexts: {
    flex: 1,
  },
  sheetInfoLabel: {
    ...typography.labelSmall,
    color: theme.colorRoles.onSurfaceVariant,
  },
  sheetInfoValue: {
    ...typography.bodyLarge,
    color: theme.colorRoles.onSurface,
    fontWeight: '500',
  },
});

export default UsersScreen;
