import { View, Text, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { spacing, typography, radii } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
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

  const menuItems = [
    { icon: 'account-circle', label: 'Mi Perfil', onPress: () => { } },
    { icon: 'cog', label: 'Configuración', onPress: () => { } },
    { icon: 'shield-account', label: 'Privacidad', onPress: () => { } },
    { icon: 'help-circle', label: 'Ayuda y Soporte', onPress: () => { } },
  ];

  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: spacing['3xl'] + insets.bottom },
      ]}
    >
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        style={[
          styles.header,
          {
            backgroundColor: theme.primary,
            paddingTop: insets.top + spacing.xl,
            borderBottomLeftRadius: radii['2xl'],
            borderBottomRightRadius: radii['2xl'],
          },
        ]}
      >
        <Avatar name={userName} size={spacing['4xl']} style={styles.avatar} />
        <Text
          style={[
            styles.name,
            {
              color: theme.textInverse,
              fontSize: typography.sizes['2xl'],
              fontWeight: typography.weights.bold,
            },
          ]}
        >
          {userName}
        </Text>
        <Text
          style={[
            styles.email,
            {
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: typography.sizes.base,
            },
          ]}
        >
          {user?.email || 'usuario@ejemplo.com'}
        </Text>
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: radii.xl,
              paddingHorizontal: spacing.base,
              paddingVertical: spacing['2xs'] + spacing.xs,
            },
          ]}
        >
          <Text
            style={[
              styles.roleText,
              {
                color: theme.textInverse,
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.medium,
              },
            ]}
          >
            {user?.role || 'Usuario'}
          </Text>
        </View>
      </Animated.View>

      <View style={[styles.menuContainer, { padding: spacing.base }]}>
        {menuItems.map((item, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(200 + index * 80).duration(400)}
          >
            <Card
              variant="outlined"
              padding={0}
              style={[
                styles.menuCard,
                { marginBottom: spacing.sm },
              ]}
            >
              <View style={styles.menuItemInner}>
                <View
                  style={[
                    styles.menuIcon,
                    {
                      backgroundColor: theme.surfaceVariant,
                      borderRadius: radii.full,
                      width: spacing.xl + spacing.md,
                      height: spacing.xl + spacing.md,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color={theme.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.menuText,
                    {
                      color: theme.text,
                      fontSize: typography.sizes.base,
                      fontWeight: typography.weights.medium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.textMuted}
                />
              </View>
            </Card>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <View style={{ marginTop: spacing.md }}>
            <Button
              title="Cerrar Sesión"
              onPress={handleLogout}
              variant="danger"
              size="lg"
              fullWidth
              icon={
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color={theme.textInverse}
                />
              }
            />
          </View>
        </Animated.View>
      </View>
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
    marginBottom: spacing.lg,
  },
  avatar: {
    marginBottom: spacing.base,
  },
  name: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  email: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  roleBadge: {
    alignItems: 'center',
  },
  roleText: {},
  menuContainer: {},
  menuCard: {},
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.base,
  },
  menuText: {
    flex: 1,
    marginLeft: spacing.base,
  },
});
