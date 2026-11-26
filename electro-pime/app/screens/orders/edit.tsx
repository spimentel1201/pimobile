import { colors } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import OrderForm from '../../components/OrderForm';
import Toast from '../../components/ui/Toast';
import { RepairOrder, CreateRepairOrderDto, UpdateRepairOrderDto, Quote } from '../../types/api';

export default function EditOrderScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isDark } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [isDark]);
    const [order, setOrder] = useState<RepairOrder | null>(null);
    const [paidQuote, setPaidQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

        // Presupuesto pagado de la orden: bloquea ítems y costo de revisión (409)
        try {
            const quotes = await api.getQuotesByRepairOrder(id!);
            setPaidQuote(quotes.find((q) => q.status === 'PAID') ?? null);
        } catch (err) {
            console.error('Error fetching quotes for order:', err);
            setPaidQuote(null);
        }
    };

    const handleSubmit = async (data: CreateRepairOrderDto) => {
        setSaving(true);
        setFeedback(null);
        try {
            const updateData: UpdateRepairOrderDto = {
                ...data,
            };
            await api.updateRepairOrder(id!, updateData);
            // Confirmación rápida y redirección a la lista (que se refresca al recuperar el foco)
            setFeedback({ message: 'Orden actualizada correctamente', type: 'success' });
            setTimeout(() => router.replace('/orders'), 1200);
        } catch (err: any) {
            console.error('Error updating order:', err);
            setFeedback({ message: err.message || 'No se pudo actualizar la orden', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando orden...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Orden no encontrada</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {feedback && <Toast message={feedback.message} type={feedback.type} />}
            <OrderForm
                initialData={order}
                onSubmit={handleSubmit}
                loading={saving}
                moneyLocked={!!paidQuote}
                paidTotal={paidQuote?.totalAmount}
            />
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.canvas,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.textSecondary,
    },
    errorText: {
        fontSize: 16,
        color: colors.danger,
        textAlign: 'center',
    },
});
