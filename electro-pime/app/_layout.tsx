import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useSegments, useRouter, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import BottomTabBar from './components/BottomTabBar';
import CustomHeader, { StackScreenWithCustomHeader } from './components/CustomHeader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ServiceOrderProvider } from './contexts/ServiceOrderContext';
// SecureStore is imported in AuthContext

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const HIDDEN_ROUTES = ['/login', '/register', '/welcome', '/'];

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const colorScheme = useColorScheme();

  const router = useRouter();

  useEffect(() => {
    const path = `/${segments.join('/')}`;
    const isAuthRoute = HIDDEN_ROUTES.includes(path) || path.startsWith('/auth/');
    
    // Redirect logic
    if (!loading) {
      if (!user && !isAuthRoute) {
        // User not logged in and not on auth route, redirect to login
        // Using router.navigate with type assertion
        (router as any).navigate('login');
      } else if (user && isAuthRoute) {
        // User logged in but on auth route, redirect to home
        (router as any).navigate('dashboard');
      }
    }
    
    // Show/hide tab bar based on route
    setIsTabBarVisible(!isAuthRoute);
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
        <Stack 
          screenOptions={{
            header: (props) => <CustomHeader {...props} />,
            contentStyle: { backgroundColor: '#f8fafc' },
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Iniciar Sesión' }} />
          <Stack.Screen name="register" options={{ title: 'Registrarse' }} />
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

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Add any initialization logic here
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
  }, [fontsLoaded]);

  if (!loaded || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ServiceOrderProvider>
        <RootLayoutNav />
      </ServiceOrderProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});