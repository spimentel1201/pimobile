// ponytail: M3 Profile Screen with tonal hero card, M3 List Items and ConfirmDialog
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, typography, tonalElevation } from './theme';
import Card from './components/ui/Card';
import StatusBadge from './components/ui/StatusBadge';
import ConfirmDialog from './components/ui/ConfirmDialog';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isDark, isSystem, setPreference } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const styles = React.useMemo(() => createStyles(colors), [isDark]);

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setShowLogoutDialog(false);
      router.replace('/login');
    } catch {
      setShowLogoutDialog(false);
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const menuSections = [
    {
      title: 'Cuenta y Taller',
      items: [
        {
          icon: 'account-outline',
          label: 'Datos de la Cuenta',
          subtitle: 'Nombre, correo y teléfono registrado',
          onPress: () => {},
        },
        {
          icon: 'wrench-clock',
          label: 'Mis Reparaciones Asignadas',
          subtitle: 'Historial de órdenes atendidas',
          onPress: () => router.push('/orders'),
        },
      ],
    },
    {
      title: 'Sistema y Ajustes',
      items: [
        {
          icon: 'printer-pos-outline',
          label: 'Configuración de Ticketera',
          subtitle: 'Impresoras térmicas Bluetooth / USB (58mm, 80mm)',
          onPress: () => {},
        },
        {
          icon: 'shield-check-outline',
          label: 'Seguridad y Permisos',
          subtitle: `Rol actual: ${user?.role === 'ADMIN' ? 'Administrador' : 'Técnico Especialista'}`,
          onPress: () => {},
        },
        {
          icon: 'help-circle-outline',
          label: 'Soporte y Asistencia',
          subtitle: 'Manual de uso y contacto técnico',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: 110 },
        ]}
      >
        {/* User Hero Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {user?.firstName?.charAt(0) || 'T'}
              {user?.lastName?.charAt(0) || ''}
            </Text>
          </View>

          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email || 'tecnico@electropime.com'}</Text>

          <View style={styles.badgeRow}>
            <StatusBadge
              label={user?.role === 'ADMIN' ? 'Administrador del Taller' : 'Técnico Certificado'}
              color={user?.role === 'ADMIN' ? colors.violet : colors.primary}
              soft={user?.role === 'ADMIN' ? colors.violetSoft : colors.primarySoft}
              icon={user?.role === 'ADMIN' ? 'shield-crown' : 'account-wrench'}
            />
          </View>
        </Card>

        {/* Menu Sections */}
        {menuSections.map((sec, sIdx) => (
          <View key={sIdx} style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Card style={styles.menuCard}>
              {sec.items.map((item, iIdx) => (
                <Pressable
                  key={iIdx}
                  style={[styles.menuItem, iIdx > 0 && styles.itemDivider]}
                  onPress={item.onPress}
                  android_ripple={{ color: 'rgba(0, 82, 255, 0.12)' }}
                >
                  <View style={styles.menuIconCircle}>
                    <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.primary} />
                  </View>
                  <View style={styles.menuTextCol}>
                    <Text style={styles.menuItemTitle}>{item.label}</Text>
                    {item.subtitle && <Text style={styles.menuItemSub}>{item.subtitle}</Text>}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}

        {/* Apariencia */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <Card style={styles.menuCard}>
            <View style={styles.switchRow}>
              <View style={styles.menuIconCircle}>
                <MaterialCommunityIcons name="theme-light-dark" size={22} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Modo oscuro</Text>
                <Text style={styles.menuItemSub}>
                  {isSystem ? 'Automático (sistema)' : 'Manual'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(v) => setPreference(v ? 'dark' : 'light')}
                trackColor={{ false: colors.surfaceContainer, true: colors.primarySoft }}
                thumbColor={isDark ? colors.primary : colors.surface}
              />
            </View>
            <View style={[styles.switchRow, styles.itemDivider]}>
              <View style={styles.menuIconCircle}>
                <MaterialCommunityIcons name="cellphone-cog" size={22} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Seguir configuración del sistema</Text>
                <Text style={styles.menuItemSub}>Usa el tema del teléfono</Text>
              </View>
              <Switch
                value={isSystem}
                onValueChange={(v) => setPreference(v ? 'system' : (isDark ? 'dark' : 'light'))}
                trackColor={{ false: colors.surfaceContainer, true: colors.primarySoft }}
                thumbColor={isSystem ? colors.primary : colors.surface}
              />
            </View>
          </Card>
        </View>

        {/* Logout Button */}
        <Pressable
          style={styles.logoutBtn}
          onPress={() => {
            Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowLogoutDialog(true);
          }}
          android_ripple={{ color: 'rgba(186, 26, 26, 0.15)' }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </Pressable>

        <Text style={styles.versionText}>Electro-Pime v1.0.0 · Material You M3</Text>
      </ScrollView>

      {/* Logout Confirm Dialog */}
      {showLogoutDialog && (
        <ConfirmDialog
          visible={showLogoutDialog}
          title="Cerrar Sesión"
          message="¿Está seguro que desea salir del sistema de taller?"
          confirmLabel="Cerrar Sesión"
          onConfirm={performLogout}
          onCancel={() => setShowLogoutDialog(false)}
          tone="danger"
          busy={loggingOut}
          icon="logout"
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarInitials: {
    ...typography.headlineMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  userName: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  userEmail: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    marginTop: spacing.xs,
  },
  sectionWrapper: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.labelLarge,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.3)',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  menuItemSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    marginVertical: spacing.md,
  },
  logoutBtnText: {
    ...typography.labelLarge,
    color: colors.danger,
    fontWeight: '700',
  },
  versionText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
