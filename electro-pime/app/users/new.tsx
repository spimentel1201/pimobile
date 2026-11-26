// ponytail: M3 NewUserScreen with outlined floating fields, role selector chips, and native ripple submit.
import React, { useState } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { theme, typography, spacing, radius } from '../theme';
import { Card, M3TextField } from '../components/ui';
import AppHeader from '../components/AppHeader';

const ROLE_OPTIONS: { value: 'ADMIN' | 'TECHNICIAN'; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; description: string }[] = [
  {
    value: 'TECHNICIAN',
    label: 'Técnico',
    icon: 'wrench',
    description: 'Gestiona órdenes asignadas, diagnósticos y repuestos.',
  },
  {
    value: 'ADMIN',
    label: 'Administrador',
    icon: 'shield-account',
    description: 'Acceso total: métricas, usuarios, finanzas y configuración.',
  },
];

export default function NewUserScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'TECHNICIAN' | null>('TECHNICIAN');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }
    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'Ingrese un correo electrónico válido';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!role) {
      newErrors.role = 'Seleccione un rol para el usuario';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validate()) return;

    setLoading(true);
    try {
      await api.createUser({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        role: role!,
      });

      Alert.alert(
        '¡Éxito!',
        'Usuario creado correctamente en el sistema',
        [{ text: 'Aceptar', onPress: () => router.replace('/users') }]
      );
    } catch (error: any) {
      console.error('Error creating user:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Nuevo Usuario"
        subtitle="Registro de técnicos o administradores"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Card variant="filled" style={styles.formCard}>
          <Text style={styles.sectionHeader}>Datos Personales</Text>

          <M3TextField
            label="Nombre"
            placeholder="Ej. Carlos"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (errors.firstName) setErrors((e) => ({ ...e, firstName: '' }));
            }}
            leadingIcon="account-outline"
            errorText={errors.firstName}
            autoCapitalize="words"
          />

          <M3TextField
            label="Apellido"
            placeholder="Ej. González"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (errors.lastName) setErrors((e) => ({ ...e, lastName: '' }));
            }}
            leadingIcon="account"
            errorText={errors.lastName}
            autoCapitalize="words"
          />

          <M3TextField
            label="Correo electrónico"
            placeholder="usuario@ejemplo.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((e) => ({ ...e, email: '' }));
            }}
            leadingIcon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            errorText={errors.email}
          />

          <M3TextField
            label="Teléfono (opcional)"
            placeholder="Ej. 987 654 321"
            value={phone}
            onChangeText={setPhone}
            leadingIcon="phone-outline"
            keyboardType="phone-pad"
          />

          <M3TextField
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((e) => ({ ...e, password: '' }));
            }}
            leadingIcon="lock-outline"
            secureTextEntry={!showPassword}
            trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onTrailingIconPress={() => setShowPassword(!showPassword)}
            errorText={errors.password}
          />

          {/* Role Selection */}
          <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>Rol en el Taller</Text>
          <View style={styles.rolesRow}>
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = role === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.roleCard,
                    isSelected && styles.roleCardActive,
                  ]}
                  android_ripple={{ color: theme.colorRoles.primaryContainer }}
                  onPress={() => {
                    Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRole(opt.value);
                  }}
                >
                  <View style={styles.roleCardHeader}>
                    <View
                      style={[
                        styles.roleIconBadge,
                        {
                          backgroundColor: isSelected
                            ? theme.colorRoles.primaryContainer
                            : theme.colorRoles.surfaceContainerHighest,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={22}
                        color={isSelected ? theme.colorRoles.primary : theme.colorRoles.onSurfaceVariant}
                      />
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={theme.colorRoles.primary}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.roleCardTitle,
                      isSelected && { color: theme.colorRoles.primary, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.roleCardDesc}>{opt.description}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            android_ripple={{ color: theme.colorRoles.outlineVariant }}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && { opacity: 0.8 },
              loading && { opacity: 0.6 },
            ]}
            android_ripple={{ color: theme.colorRoles.primaryContainer }}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colorRoles.onPrimary} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={theme.colorRoles.onPrimary} />
                <Text style={styles.submitBtnText}>Registrar Usuario</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorRoles.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 48,
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.sm,
  },
  sectionHeader: {
    ...typography.titleMedium,
    color: theme.colorRoles.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: theme.colorRoles.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: theme.colorRoles.outlineVariant,
  },
  roleCardActive: {
    backgroundColor: theme.colorRoles.surfaceContainerHighest,
    borderColor: theme.colorRoles.primary,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  roleIconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardTitle: {
    ...typography.titleSmall,
    color: theme.colorRoles.onSurface,
    fontWeight: '600',
    marginTop: 4,
  },
  roleCardDesc: {
    ...typography.bodySmall,
    color: theme.colorRoles.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  errorText: {
    ...typography.labelSmall,
    color: theme.colorRoles.error,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: theme.colorRoles.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colorRoles.surface,
  },
  cancelBtnText: {
    ...typography.labelLarge,
    color: theme.colorRoles.onSurface,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: theme.colorRoles.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  submitBtnText: {
    ...typography.labelLarge,
    color: theme.colorRoles.onPrimary,
    fontWeight: '700',
  },
});
