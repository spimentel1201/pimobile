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

export default function RegisterScreen() {
    const router = useRouter();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'El nombre es requerido';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'El apellido es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El correo es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Ingresa un correo válido';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'El teléfono es requerido';
        } else if (!/^\d{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Ingresa un número válido (9-15 dígitos)';
        }

        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Mínimo 8 caracteres';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
            newErrors.password = 'Debe incluir mayúscula, minúscula, número y símbolo';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await register({
                email: formData.email.trim(),
                password: formData.password,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim(),
            });
            router.replace('/dashboard');
        } catch (error: any) {
            Alert.alert(
                'Error de registro',
                error.message || 'No se pudo completar el registro. Por favor, intenta de nuevo.'
            );
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
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
                    <Ionicons name="person-add" size={56} color="#3B82F6" />
                    <Text style={styles.title}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>Completa tus datos para registrarte</Text>
                </View>

                <View style={styles.form}>
                    {/* First Name */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            placeholderTextColor="#9CA3AF"
                            value={formData.firstName}
                            onChangeText={(value) => updateField('firstName', value)}
                            autoCapitalize="words"
                        />
                    </View>
                    {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

                    {/* Last Name */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Apellido"
                            placeholderTextColor="#9CA3AF"
                            value={formData.lastName}
                            onChangeText={(value) => updateField('lastName', value)}
                            autoCapitalize="words"
                        />
                    </View>
                    {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Correo electrónico"
                            placeholderTextColor="#9CA3AF"
                            value={formData.email}
                            onChangeText={(value) => updateField('email', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                    {/* Phone */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Teléfono"
                            placeholderTextColor="#9CA3AF"
                            value={formData.phone}
                            onChangeText={(value) => updateField('phone', value)}
                            keyboardType="phone-pad"
                        />
                    </View>
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                    {/* Password */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            placeholderTextColor="#9CA3AF"
                            value={formData.password}
                            onChangeText={(value) => updateField('password', value)}
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

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmar contraseña"
                            placeholderTextColor="#9CA3AF"
                            value={formData.confirmPassword}
                            onChangeText={(value) => updateField('confirmPassword', value)}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color="#6B7280"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Registrarse</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkContainer}
                        onPress={() => router.push('/login')}
                    >
                        <Text style={styles.linkText}>
                            ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia Sesión</Text>
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
        paddingVertical: 48,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
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
