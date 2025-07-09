import React from 'react';
import { usePathname, useSegments, Stack } from 'expo-router';
import AppHeader from './AppHeader';
import { View } from 'react-native';

const CustomHeader = ({ route, options, back }: { route: any; options: any; back?: any }) => {
  const pathname = usePathname();
  const segments = useSegments();
  
  // Lista de pantallas que no deben mostrar el encabezado
  const noHeaderScreens = [
    '/dashboard', 
    '/orders', 
    '/sales', 
    '/profile', 
    '/',
    '/users',
    '/users/'
  ];
  
  // No mostrar encabezado en las pantallas principales
  if (noHeaderScreens.includes(pathname)) {
    return null;
  }
  
  // Obtener el título de la pantalla actual
  const getScreenTitle = () => {
    if (!route) return '';
    return options.title || route.name || '';
  };
  
  // Mostrar el encabezado personalizado solo para pantallas secundarias
  return (
    <AppHeader 
      title={getScreenTitle()} 
      showBackButton={!!back}
    />
  );
};

// Componente para manejar el encabezado en el Stack
const StackScreenWithCustomHeader = (props: any) => {
  return (
    <Stack.Screen
      {...props}
      options={{
        ...props.options,
        headerShown: false, // Deshabilitar el encabezado nativo
      }}
    />
  );
};

export { CustomHeader as default, StackScreenWithCustomHeader };
