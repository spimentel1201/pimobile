import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  radii,
  ORDER_STATUS,
  QUOTE_STATUS,
  PAYMENT_METHOD,
  RepairOrderStatus,
  QuoteStatus,
  PaymentMethod,
} from './theme';
import Card from './components/ui/Card';
import StatusBadge from './components/ui/StatusBadge';
import SectionHeader from './components/ui/SectionHeader';
import MetricCard from './components/ui/MetricCard';
import EmptyState from './components/ui/EmptyState';
import SegmentedControl from './components/ui/SegmentedControl';

/**
 * Showcase / Storybook de los design tokens y componentes base (Fase 1).
 * Navegable en /showcase. Solo para verificación visual — no forma parte
 * del flujo de la app y se puede eliminar al integrar las pantallas.
 */
export default function ShowcaseScreen() {
  const [demoFilter, setDemoFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const orderStatuses = Object.keys(ORDER_STATUS) as RepairOrderStatus[];
  const quoteStatuses = Object.keys(QUOTE_STATUS) as QuoteStatus[];
  const paymentMethods = Object.keys(PAYMENT_METHOD) as PaymentMethod[];

  return (
    <View style={styles.canvas}>
      <Stack.Screen options={{ title: 'Showcase UI', headerShown: true }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Design Tokens */}
        <SectionHeader title="Tokens · Paleta" />
        <Card style={styles.block}>
          <Text style={styles.blockText}>
            canvas / surfaceMuted / surface · primary #{colors.primary.slice(1)} · success #{' '}
            {colors.success.slice(1)} · warning {colors.warning.slice(1)} · danger{' '}
            {colors.danger.slice(1)} · violet {colors.violet.slice(1)}
          </Text>
          <View style={styles.swatchRow}>
            {[
              colors.primary,
              colors.primarySoft,
              colors.success,
              colors.successSoft,
              colors.warning,
              colors.warningSoft,
              colors.danger,
              colors.dangerSoft,
              colors.violet,
              colors.violetSoft,
              colors.canvas,
              colors.border,
            ].map((c) => (
              <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
            ))}
          </View>
        </Card>

        {/* StatusBadge — órdenes */}
        <SectionHeader title="StatusBadge · Órdenes" />
        <Card style={styles.block}>
          <View style={styles.wrapRow}>
            {orderStatuses.map((s) => (
              <StatusBadge key={s} label={ORDER_STATUS[s].label} color={ORDER_STATUS[s].color} soft={ORDER_STATUS[s].soft} />
            ))}
          </View>
        </Card>

        {/* StatusBadge — presupuestos y métodos de pago */}
        <SectionHeader title="StatusBadge · Presupuestos y Pagos" />
        <Card style={styles.block}>
          <View style={styles.wrapRow}>
            {quoteStatuses.map((s) => (
              <StatusBadge key={s} label={QUOTE_STATUS[s].label} color={QUOTE_STATUS[s].color} soft={QUOTE_STATUS[s].soft} />
            ))}
            {paymentMethods.map((m) => (
              <StatusBadge key={m} label={PAYMENT_METHOD[m].label} color={PAYMENT_METHOD[m].color} soft={PAYMENT_METHOD[m].soft} />
            ))}
          </View>
        </Card>

        {/* MetricCard */}
        <SectionHeader title="MetricCard · hero + default" />
        <View style={styles.grid}>
          <MetricCard variant="hero" label="TOTAL VENTAS" value="S/ 12,450.00" icon="cash-multiple" />
        </View>
        <View style={[styles.grid, styles.gridRow]}>
          <MetricCard label="TRANSACCIONES" value="38" icon="receipt" />
          <MetricCard label="TICKET PROMEDIO" value="S/ 327" icon="chart-line" />
        </View>

        {/* SegmentedControl */}
        <SectionHeader title="SegmentedControl" />
        <SegmentedControl
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'approved', label: 'Aprobados' },
          ]}
          value={demoFilter}
          onChange={setDemoFilter}
        />

        {/* Card con barra de estado (StatusPillBar integrado) */}
        <SectionHeader title="Card · barra de estado 4px (orden)" />
        <Card accentColor={ORDER_STATUS.IN_PROGRESS.color} style={styles.cardSpacing}>
          <View style={styles.orderRow}>
            <StatusBadge
              label={ORDER_STATUS.IN_PROGRESS.label}
              color={ORDER_STATUS.IN_PROGRESS.color}
              soft={ORDER_STATUS.IN_PROGRESS.soft}
            />
            <Text style={styles.amount}>S/ 450.00</Text>
          </View>
          <Text style={styles.customer}>Sonny Pimentel</Text>
          <View style={styles.orderFooter}>
            <Text style={styles.meta}>Sony TV LED · Control</Text>
            <Text style={styles.meta}>Hoy 12:40</Text>
          </View>
        </Card>

        {/* EmptyState */}
        <SectionHeader title="EmptyState" />
        <Card style={styles.cardSpacing}>
          <EmptyState
            icon="clipboard-text-outline"
            title="Aún no hay órdenes"
            description="Las órdenes de reparación que crees aparecerán aquí."
            ctaLabel="Crear primera orden"
            onCta={() => {}}
          />
        </Card>

        <Text style={styles.footer}>
          Fase 1 · theme.ts + Card + StatusBadge + SectionHeader + MetricCard + EmptyState +
          SegmentedControl (StatusPillBar integrado como accentColor de Card)
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  block: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  blockText: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  grid: {
    marginBottom: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardSpacing: {
    marginBottom: spacing.lg,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  amount: {
    ...typography.display,
    fontSize: 22,
  },
  customer: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    ...typography.caption,
  },
  footer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
