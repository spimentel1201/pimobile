// ponytail: M3 Login Screen with workshop identity, M3TextField and native ripple
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
import { colors, radii, spacing, typography, tonalElevation } from './theme';
import M3TextField from './components/ui/M3TextField';
import Card from './components/ui/Card';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [isDark]);
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
    Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert(
        'Error de acceso',
        error.message || 'Credenciales incorrectas. Verifique sus datos.'
      );
    } finally {
      setLoading(false);
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
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="tools" size={36} color={colors.primary} />
          </View>
          <Text style={styles.appName}>ELECTRO-PIME</Text>
          <Text style={styles.appTagline}>Taller de Reparación y Repuestos</Text>
        </View>

        {/* Login Form Card */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          <Text style={styles.cardSubtitle}>
            Accede con tu cuenta de técnico o administrador
          </Text>

          <M3TextField
            label="Correo Electrónico"
            placeholder="tecnico@electropime.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            leadingIcon="email-outline"
          />

          <M3TextField
            label="Contraseña"
            placeholder="••••••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            error={errors.password}
            leadingIcon="lock-outline"
            trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onTrailingIconPress={() => setShowPassword(!showPassword)}
          />

          <Pressable
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            android_ripple={{ color: colors.rippleOnPrimary }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Entrar al Sistema</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
              </>
            )}
          </Pressable>

          <View style={styles.registerPrompt}>
            <Text style={styles.promptText}>¿Aún no tienes cuenta? </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={styles.promptLink}>Regístrate aquí</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.headlineMedium,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appTagline: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formCard: {
    padding: spacing.xl,
  },
  cardTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cardSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minHeight: 52,
    marginTop: spacing.md,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
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
