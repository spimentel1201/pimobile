import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { typography, spacing, radii } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
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
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing['2xl'], paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="person-add" size={36} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Crear Cuenta</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Completa tus datos para registrarte
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="Nombre"
            value={formData.firstName}
            onChangeText={(v) => updateField('firstName', v)}
            autoCapitalize="words"
            error={errors.firstName}
            leftIcon={<Ionicons name="person-outline" size={20} color={theme.textMuted} />}
          />

          <Input
            placeholder="Apellido"
            value={formData.lastName}
            onChangeText={(v) => updateField('lastName', v)}
            autoCapitalize="words"
            error={errors.lastName}
            leftIcon={<Ionicons name="person-outline" size={20} color={theme.textMuted} />}
          />

          <Input
            placeholder="Correo electrónico"
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            leftIcon={<Ionicons name="mail-outline" size={20} color={theme.textMuted} />}
          />

          <Input
            placeholder="Teléfono"
            value={formData.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
            error={errors.phone}
            leftIcon={<Ionicons name="call-outline" size={20} color={theme.textMuted} />}
          />

          <Input
            placeholder="Contraseña"
            value={formData.password}
            onChangeText={(v) => updateField('password', v)}
            secureTextEntry
            error={errors.password}
            showPasswordToggle
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />}
          />

          <Input
            placeholder="Confirmar contraseña"
            value={formData.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            secureTextEntry
            error={errors.confirmPassword}
            showPasswordToggle
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />}
          />

          <Button
            title="Registrarse"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            style={{ marginTop: spacing.md }}
          />

          <View style={styles.linkContainer}>
            <Text style={[styles.linkText, { color: theme.textSecondary }]}>
              ¿Ya tienes cuenta?{' '}
            </Text>
            <Button
              title="Inicia Sesión"
              onPress={() => router.push('/login')}
              variant="ghost"
              size="sm"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  form: {
    width: '100%',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    fontSize: typography.sizes.sm,
  },
});
