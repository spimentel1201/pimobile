import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { typography, spacing, radii, shadows } from '../constants/theme';

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
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { theme, colorScheme } = useTheme();

  const isActive = (route: string) => {
    const currentPath = `/${segments.join('/')}`;
    const targetRoute = route === 'dashboard' ? '/' : `/${route}`;
    return currentPath === targetRoute || (route === 'dashboard' && currentPath === '/');
  };

  const handleNavigation = (route: string) => {
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
          borderTopColor: theme.divider,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <BlurView
        intensity={colorScheme === 'dark' ? 80 : 90}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: theme.tabBar },
          ]}
        >
          {tabs.map((tab) => {
            const active = isActive(tab.route);
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => handleNavigation(tab.route)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    active && {
                      backgroundColor: theme.primaryLight,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as ComponentProps<typeof MaterialCommunityIcons>['name']}
                    size={22}
                    color={active ? theme.primary : theme.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: active ? theme.primary : theme.textMuted,
                    },
                  ]}
                >
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
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    zIndex: 100,
  },
  blurContainer: {
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: spacing['2xs'],
  },
  iconContainer: {
    width: 40,
    height: 28,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
