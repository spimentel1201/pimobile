import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ComponentProps } from 'react';

const { width } = Dimensions.get('window');

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

  const isActive = (route: string) => {
    const currentPath = `/${segments.join('/')}`;
    const targetRoute = route === 'dashboard' ? '/' : `/${route}`;
    return currentPath === targetRoute || (route === 'dashboard' && currentPath === '/');
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
      <BlurView intensity={90} tint="light" style={styles.blurContainer}>
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => handleNavigation(tab.route)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tab.icon as ComponentProps<typeof MaterialCommunityIcons>['name']}
                size={24}
                color={isActive(tab.route) ? '#2563eb' : '#64748b'}
              />
              <Text 
                style={[
                  styles.tabText, 
                  { color: isActive(tab.route) ? '#2563eb' : '#64748b' }
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
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
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  blurContainer: {
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'SpaceMono',
  },
});
