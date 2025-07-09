import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import BottomTabBar from './components/BottomTabBar';
import CustomHeader, { StackScreenWithCustomHeader } from './components/CustomHeader';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const HIDDEN_ROUTES = ['/login', '/register', '/welcome'];

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, setLoaded] = useState(false);
  const segments = useSegments();
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  // Cargar fuentes
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Verificar si la ruta actual debe ocultar la barra de pestañas
        const path = `/${segments.join('/')}`;
        setIsTabBarVisible(!HIDDEN_ROUTES.some(route => path.startsWith(route)));

        // Pequeño delay para asegurar la carga
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setLoaded(true);
        await SplashScreen.hideAsync();
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded, segments]);

  if (!loaded || !fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
        <Stack 
          screenOptions={{
            header: (props) => <CustomHeader {...props} />,
            contentStyle: { backgroundColor: '#f8fafc' },
            headerShown: false, // Deshabilitar encabezado por defecto
          }}
        >
          <StackScreenWithCustomHeader name="index" options={{ title: 'Inicio' }} />
          <StackScreenWithCustomHeader name="dashboard" options={{ title: 'Dashboard' }} />
          <StackScreenWithCustomHeader name="orders" options={{ title: 'Órdenes' }} />
          <StackScreenWithCustomHeader name="orders/new" options={{ title: 'Nueva Orden' }} />
          <StackScreenWithCustomHeader name="sales" options={{ title: 'Ventas' }} />
          <StackScreenWithCustomHeader name="profile" options={{ title: 'Perfil' }} />
          <StackScreenWithCustomHeader name="products" options={{ title: 'Productos' }} />
          <StackScreenWithCustomHeader name="customers" options={{ title: 'Clientes' }} />
          <StackScreenWithCustomHeader name="budgets" options={{ title: 'Presupuestos' }} />
          <StackScreenWithCustomHeader name="users" options={{ title: 'Usuarios' }} />
          <StackScreenWithCustomHeader name="users/new" options={{ title: 'Nuevo Usuario' }} />
          <StackScreenWithCustomHeader name="+not-found" options={{ title: 'No encontrado' }} />
        </Stack>
        
        {isTabBarVisible && <BottomTabBar />}
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});