import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ComponentProps } from 'react';
import { colors, radii, shadow, spacing } from '../theme';

type TabItem = {
  name: string;
  icon: string;
  route: string;
};

const tabs: TabItem[] = [
  { name: 'Inicio', icon: 'view-dashboard', route: 'dashboard' },
  { name: 'Órdenes', icon: 'clipboard-text', route: 'orders' },
  { name: 'Ventas', icon: 'sale', route: 'sales' },
  { name: 'Perfil', icon: 'account', route: 'profile' },
];

export default function BottomTabBar() {
  const router = useRouter();
  const segments = useSegments();

  const isActive = (route: string) => {
    const currentPath = `/${segments.join('/')}`;
    const targetRoute = route === 'dashboard' ? '/' : `/${route}`;
    return currentPath === targetRoute || (route === 'dashboard' && currentPath === '/dashboard');
  };

  const handleNavigation = (route: string) => {
    // Mapeo de rutas permitidas
    const allowedRoutes = {
      'dashboard': '/dashboard',
      'orders': '/orders',
      'sales': '/sales',
      'profile': '/profile'
    } as const;

    // Verificar si la ruta es válida
    const targetRoute = allowedRoutes[route as keyof typeof allowedRoutes];
    if (targetRoute) {
      router.push(targetRoute as any);
    } else {
      console.warn(`Ruta no válida: ${route}`);
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={90} tint="light" style={styles.pill}>
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const active = isActive(tab.route);
            return (
              <TouchableOpacity
                key={tab.name}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => handleNavigation(tab.route)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={tab.icon as ComponentProps<typeof MaterialCommunityIcons>['name']}
                  size={22}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pill flotante despegada del borde: margin 12 + radio completo
  container: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    ...shadow,
  },
  pill: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    gap: 6,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: colors.primarySoft,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
