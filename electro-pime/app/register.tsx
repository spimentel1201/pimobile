// ponytail: M3 Register Screen with M3TextField, validations and native ripple
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, typography } from './theme';
import M3TextField from './components/ui/M3TextField';
import Card from './components/ui/Card';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [isDark]);
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
      newErrors.password = 'Debe incluir mayúscula, minúscula, número y símbolo (@$!%*?&)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        error.message || 'No se pudo completar el registro. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account-plus-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Crear Cuenta Técnica</Text>
          <Text style={styles.subtitle}>Únete al equipo del taller Electro-Pime</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.nameRow}>
            <M3TextField
              containerStyle={styles.halfField}
              label="Nombre *"
              placeholder="Ej: Carlos"
              value={formData.firstName}
              onChangeText={(v) => updateField('firstName', v)}
              error={errors.firstName}
              leadingIcon="account-outline"
            />
            <M3TextField
              containerStyle={styles.halfField}
              label="Apellido *"
              placeholder="Ej: Méndez"
              value={formData.lastName}
              onChangeText={(v) => updateField('lastName', v)}
              error={errors.lastName}
              leadingIcon="account-outline"
            />
          </View>

          <M3TextField
            label="Correo Electrónico *"
            placeholder="tecnico@ejemplo.com"
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            leadingIcon="email-outline"
          />

          <M3TextField
            label="Teléfono / Celular *"
            placeholder="987 654 321"
            value={formData.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
            error={errors.phone}
            leadingIcon="phone-outline"
          />

          <M3TextField
            label="Contraseña *"
            placeholder="Mínimo 8 caracteres..."
            value={formData.password}
            onChangeText={(v) => updateField('password', v)}
            secureTextEntry={!showPassword}
            error={errors.password}
            leadingIcon="lock-outline"
            trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onTrailingIconPress={() => setShowPassword(!showPassword)}
          />

          <M3TextField
            label="Confirmar Contraseña *"
            placeholder="Repite la contraseña..."
            value={formData.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            secureTextEntry={!showConfirmPassword}
            error={errors.confirmPassword}
            leadingIcon="lock-check-outline"
            trailingIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
            onTrailingIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            android_ripple={{ color: colors.rippleOnPrimary }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Registrarse</Text>
                <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
              </>
            )}
          </Pressable>

          <View style={styles.loginPrompt}>
            <Text style={styles.promptText}>¿Ya tienes una cuenta? </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.promptLink}>Inicia sesión</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    padding: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minHeight: 52,
    marginTop: spacing.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  promptText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  promptLink: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '700',
  },
});
