// ponytail: Material Design 3 Navigation Bar with active indicator pill and haptics
import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, typography } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

type TabItem = {
  name: string;
  activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  inactiveIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
};

const tabs: TabItem[] = [
  {
    name: 'Inicio',
    activeIcon: 'view-dashboard',
    inactiveIcon: 'view-dashboard-outline',
    route: 'dashboard',
  },
  {
    name: 'Órdenes',
    activeIcon: 'clipboard-text',
    inactiveIcon: 'clipboard-text-outline',
    route: 'orders',
  },
  {
    name: 'Ventas',
    activeIcon: 'sale',
    inactiveIcon: 'sale',
    route: 'sales',
  },
  {
    name: 'Perfil',
    activeIcon: 'account-circle',
    inactiveIcon: 'account-circle-outline',
    route: 'profile',
  },
];

export default function BottomTabBar() {
  const router = useRouter();
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => {
    const currentPath = `/${segments.join('/')}`;
    const targetRoute = route === 'dashboard' ? '/' : `/${route}`;
    return currentPath === targetRoute || (route === 'dashboard' && currentPath === '/dashboard');
  };

  const handleNavigation = (route: string) => {
    Platform.OS !== 'web' && Haptics.selectionAsync();

    const allowedRoutes = {
      dashboard: '/dashboard',
      orders: '/orders',
      sales: '/sales',
      profile: '/profile',
    } as const;

    const targetRoute = allowedRoutes[route as keyof typeof allowedRoutes];
    if (targetRoute) {
      router.push(targetRoute as any);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, spacing.xs),
          height: 72 + Math.max(insets.bottom, spacing.xs),
        },
      ]}
    >
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          return (
            <Pressable
              key={tab.name}
              style={styles.tab}
              onPress={() => handleNavigation(tab.route)}
              android_ripple={{ color: 'rgba(0, 82, 255, 0.12)', borderless: true, radius: 28 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.name}
            >
              <View style={[styles.indicator, active && styles.indicatorActive]}>
                <MaterialCommunityIcons
                  name={active ? tab.activeIcon : tab.inactiveIcon}
                  size={24}
                  color={active ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.tabText,
                  active ? styles.tabTextActive : styles.tabTextInactive,
                ]}
                numberOfLines={1}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.surfaceContainer,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 199, 208, 0.4)',
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 72,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  indicator: {
    width: 60,
    height: 32,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  indicatorActive: {
    backgroundColor: colors.primarySoft,
  },
  tabText: {
    ...typography.labelSmall,
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabTextInactive: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
