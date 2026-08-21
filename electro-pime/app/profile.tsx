import { View, Text, StyleSheet, Alert, Platform, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useThemeContext } from '../contexts/ThemeContext';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { spacing, typography, radii, shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Claro', icon: 'white-balance-sunny' },
  { value: 'dark' as const, label: 'Oscuro', icon: 'moon-waning-crescent' },
  { value: 'system' as const, label: 'Sistema', icon: 'cellphone' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, colorScheme } = useTheme();
  const { themePreference, setThemePreference, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  const performLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.replace('/login');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Está seguro que desea cerrar sesión?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Está seguro que desea cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: spacing['3xl'] + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        style={[
          styles.header,
          {
            backgroundColor: theme.primary,
            paddingTop: insets.top + spacing.xl,
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          <Avatar name={userName} size={80} style={styles.avatar} />
          <View style={[styles.onlineIndicator, { backgroundColor: '#10B981' }]} />
        </View>
        <Text style={[styles.name, { color: '#FFFFFF' }]}>{userName}</Text>
        <Text style={[styles.email, { color: 'rgba(255,255,255,0.7)' }]}>
          {user?.email || 'usuario@ejemplo.com'}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#FFFFFF" />
          <Text style={[styles.roleText, { color: '#FFFFFF' }]}>
            {user?.role || 'Usuario'}
          </Text>
        </View>
      </Animated.View>

      {/* Theme Selector */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Apariencia</Text>
        <Card variant="elevated" padding={0} style={styles.themeCard}>
          {THEME_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                index < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={() => setThemePreference(option.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.themeIcon, { backgroundColor: isDark && themePreference === option.value ? theme.primaryLight : theme.surfaceVariant }]}>
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={20}
                  color={themePreference === option.value ? theme.primary : theme.textSecondary}
                />
              </View>
              <Text style={[styles.themeLabel, { color: theme.text }]}>{option.label}</Text>
              {themePreference === option.value && (
                <MaterialCommunityIcons name="check-circle" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </Card>
      </Animated.View>

      {/* Menu Sections */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Cuenta</Text>
        <Card variant="elevated" padding={0}>
          {[
            { icon: 'account-circle', label: 'Mi Perfil', onPress: () => {} },
            { icon: 'cog', label: 'Configuración', onPress: () => {} },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.surfaceVariant }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={theme.textSecondary} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Soporte</Text>
        <Card variant="elevated" padding={0}>
          {[
            { icon: 'shield-account', label: 'Privacidad', onPress: () => {} },
            { icon: 'help-circle', label: 'Ayuda y Soporte', onPress: () => {} },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.surfaceVariant }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={theme.textSecondary} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          fullWidth
          icon={
            <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />
          }
        />
      </Animated.View>

      {/* App Version */}
      <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.textMuted }]}>
          Electrónica Pimentel v1.0.0
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii['2xl'],
    borderBottomRightRadius: radii['2xl'],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.base,
  },
  avatar: {
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#2563EB',
  },
  name: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  email: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  roleText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  themeCard: {
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  themeIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  themeLabel: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
  },
  versionText: {
    fontSize: typography.sizes.xs,
  },
});
