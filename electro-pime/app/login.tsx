import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'El correo es requerido';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Ingresa un correo válido';
        }

        if (!password) {
            newErrors.password = 'La contraseña es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await login({ email: email.trim(), password });
            router.replace('/dashboard');
        } catch (error: any) {
            Alert.alert(
                'Error de inicio de sesión',
                error.message || 'Credenciales incorrectas. Por favor, intenta de nuevo.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Ionicons name="construct" size={64} color="#3B82F6" />
                    <Text style={styles.title}>Electro Pime</Text>
                    <Text style={styles.subtitle}>Gestión de Reparaciones</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Correo electrónico"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color="#6B7280"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Iniciar Sesión</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkContainer}
                        onPress={() => router.push('/register')}
                    >
                        <Text style={styles.linkText}>
                            ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        marginTop: 8,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        marginBottom: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        color: '#FFFFFF',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 8,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 4,
    },
    button: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    linkContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    linkText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    linkTextBold: {
        color: '#3B82F6',
        fontWeight: '600',
    },
});
