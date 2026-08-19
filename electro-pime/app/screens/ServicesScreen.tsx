import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radii, shadows } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';

interface ServiceItem {
  id: string;
  icon: string;
  name: string;
  description: string;
  priceRange: string;
  color: string;
  bg: string;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: '1',
    icon: 'cellphone',
    name: 'Reparación de Celulares',
    description: 'Reparación integral de smartphones: pantalla, batería, puerto de carga y más',
    priceRange: 'S/ 50 – S/ 500',
    color: '#2563EB',
    bg: '#DBEAFE',
  },
  {
    id: '2',
    icon: 'laptop',
    name: 'Reparación de Laptops',
    description: 'Diagnóstico y reparación de computadoras portátiles de todas las marcas',
    priceRange: 'S/ 100 – S/ 800',
    color: '#6366F1',
    bg: '#E0E7FF',
  },
  {
    id: '3',
    icon: 'tablet',
    name: 'Reparación de Tablets',
    description: 'Servicio de reparación para tablets iPad, Samsung, Huawei y otras',
    priceRange: 'S/ 80 – S/ 600',
    color: '#8B5CF6',
    bg: '#EDE9FE',
  },
  {
    id: '4',
    icon: 'monitor',
    name: 'Cambio de Pantalla',
    description: 'Reemplazo de pantallas LCD, OLED y touchscreen dañadas',
    priceRange: 'S/ 80 – S/ 700',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  {
    id: '5',
    icon: 'battery',
    name: 'Cambio de Batería',
    description: 'Sustitución de baterías originales y de alta calidad',
    priceRange: 'S/ 40 – S/ 300',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  {
    id: '6',
    icon: 'magnify',
    name: 'Diagnóstico General',
    description: 'Evaluación completa del dispositivo para identificar problemas',
    priceRange: 'S/ 20 – S/ 50',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
  {
    id: '7',
    icon: 'usb',
    name: 'Cambio de Puerto de Carga',
    description: 'Reparación y reemplazo de puertos USB y conectores de carga',
    priceRange: 'S/ 40 – S/ 200',
    color: '#0EA5E9',
    bg: '#E0F2FE',
  },
  {
    id: '8',
    icon: 'volume-high',
    name: 'Reparación de Audio',
    description: 'Solución de problemas con auriculares, altavoces y micrófonos',
    priceRange: 'S/ 30 – S/ 250',
    color: '#EC4899',
    bg: '#FCE7F3',
  },
];

const ServicesScreen = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const fetchServices = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Use default services for now; replace with API call when available
      // const data = await api.getServices();
      setServices(DEFAULT_SERVICES);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchServices();
    } else {
      setLoading(false);
    }
  }, [user, fetchServices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, [fetchServices]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.text }]}>Servicios</Text>
        </View>
      </Animated.View>

      {services.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <EmptyState
            icon="wrench-outline"
            title="No hay servicios configurados"
            message="Los servicios de reparación estarán disponibles pronto"
          />
        </Animated.View>
      ) : (
        <View style={styles.listContainer}>
          {services.map((service, index) => (
            <Animated.View
              key={service.id}
              entering={FadeInDown.delay(200 + index * 80).springify()}
            >
              <Card variant="elevated" padding={spacing.base} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={[styles.serviceIcon, { backgroundColor: service.bg }]}>
                    <MaterialCommunityIcons
                      name={service.icon as any}
                      size={24}
                      color={service.color}
                    />
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: theme.text }]}>
                      {service.name}
                    </Text>
                    <Text style={[styles.serviceDescription, { color: theme.textSecondary }]}>
                      {service.description}
                    </Text>
                  </View>
                </View>
                <View style={[styles.priceRow, { borderTopColor: theme.divider }]}>
                  <MaterialCommunityIcons name="tag-outline" size={16} color={theme.textMuted} />
                  <Text style={[styles.priceRange, { color: theme.primary }]}>
                    {service.priceRange}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  listContainer: {
    padding: spacing.base,
  },
  serviceCard: {
    marginBottom: spacing.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  serviceName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing['2xs'],
  },
  serviceDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  priceRange: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});

export default ServicesScreen;
