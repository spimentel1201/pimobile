import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComponentProps } from 'react';
import { colors, radii, spacing } from '../theme';

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
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  // Barra estática: pegada al borde inferior, ancho completo (estilo app nativa)
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
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
