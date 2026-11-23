// ponytail: M3 ServicesScreen placeholder / services management screen with native app bar and service catalog cards.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, typography, spacing, radius } from '../theme';
import { Card } from '../components/ui';
import AppHeader from '../components/AppHeader';

const DEFAULT_SERVICES = [
  {
    id: '1',
    title: 'Diagnóstico y Revisión Inicial',
    icon: 'magnify-scan' as const,
    description: 'Inspección técnica general, medición eléctrica y detección de fallas.',
    category: 'General',
  },
  {
    id: '2',
    title: 'Reparación de Refrigeración',
    icon: 'fridge-outline' as const,
    description: 'Carga de refrigerante, cambio de termostato, motocompresor o ventilador.',
    category: 'Línea Blanca',
  },
  {
    id: '3',
    title: 'Reparación de Lavado y Secado',
    icon: 'washing-machine' as const,
    description: 'Cambio de bombas de drenaje, retenes, rodamientos, placas y correas.',
    category: 'Línea Blanca',
  },
  {
    id: '4',
    title: 'Reparación de Microondas y Hornos',
    icon: 'microwave' as const,
    description: 'Magnetrón, fusible de alta, diodos, transformador y micro-switches.',
    category: 'Cocina',
  },
  {
    id: '5',
    title: 'Mantenimiento Preventivo',
    icon: 'wrench-clock' as const,
    description: 'Limpieza interna, lubricación y verificación de consumos eléctricos.',
    category: 'Mantenimiento',
  },
];

const ServicesScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppHeader
        title="Catálogo de Servicios"
        subtitle="Servicios y tipos de trabajo técnico"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="tools" size={32} color={theme.colorRoles.primary} />
          <View style={styles.introTexts}>
            <Text style={styles.introTitle}>Especialidades del Taller</Text>
            <Text style={styles.introDesc}>
              Servicios estándar configurados para recepción, diagnóstico y asignación rápida a órdenes de trabajo.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Servicios Registrados</Text>

        {DEFAULT_SERVICES.map((s) => (
          <Card key={s.id} variant="elevated" style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceIconBadge}>
                <MaterialCommunityIcons name={s.icon} size={24} color={theme.colorRoles.primary} />
              </View>
              <View style={styles.serviceMeta}>
                <View style={styles.titleRow}>
                  <Text style={styles.serviceTitle}>{s.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{s.category}</Text>
                  </View>
                </View>
                <Text style={styles.serviceDesc}>{s.description}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorRoles.surface,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 48,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colorRoles.primaryContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  introTexts: {
    flex: 1,
  },
  introTitle: {
    ...typography.titleMedium,
    color: theme.colorRoles.onPrimaryContainer,
    fontWeight: '700',
  },
  introDesc: {
    ...typography.bodySmall,
    color: theme.colorRoles.onPrimaryContainer,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: theme.colorRoles.onSurface,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  serviceCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  serviceIconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: theme.colorRoles.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceMeta: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceTitle: {
    ...typography.titleSmall,
    color: theme.colorRoles.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: theme.colorRoles.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  categoryText: {
    ...typography.labelSmall,
    color: theme.colorRoles.onSurfaceVariant,
    fontWeight: '600',
  },
  serviceDesc: {
    ...typography.bodySmall,
    color: theme.colorRoles.onSurfaceVariant,
    lineHeight: 16,
  },
});

export default ServicesScreen;
