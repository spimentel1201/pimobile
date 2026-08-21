import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import OrderForm from '../../../components/OrderForm';
import { RepairOrder, CreateRepairOrderDto, UpdateRepairOrderDto } from '../../../types/api';
import { useTheme } from '../../../hooks/useTheme';
import { typography, spacing } from '../../../constants/theme';

export default function EditOrderScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const [order, setOrder] = useState<RepairOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const fetchOrder = async () => {
        try {
            setError(null);
            const data = await api.getRepairOrderById(id!);
            setOrder(data);
        } catch (err: any) {
            console.error('Error fetching order:', err);
            setError(err.message || 'Error al cargar la orden');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: CreateRepairOrderDto) => {
        setSaving(true);
        try {
            const updateData: UpdateRepairOrderDto = {
                ...data,
            };
            await api.updateRepairOrder(id!, updateData);
            Alert.alert('Éxito', 'Orden actualizada correctamente', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo actualizar la orden');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Cargando orden...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <Text style={[styles.errorText, { color: theme.error }]}>Orden no encontrada</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <OrderForm
                initialData={order}
                onSubmit={handleSubmit}
                loading={saving}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        marginTop: spacing.sm,
        fontSize: typography.sizes.md,
    },
    errorText: {
        fontSize: typography.sizes.md,
        textAlign: 'center',
    },
});
