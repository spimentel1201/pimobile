import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';

const ROLE_OPTIONS: { value: 'ADMIN' | 'TECHNICIAN'; label: string }[] = [
  { value: 'TECHNICIAN', label: 'Técnico' },
  { value: 'ADMIN', label: 'Administrador' },
];

export default function NewUserScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'TECHNICIAN' | null>(null);

  const validate = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Ingrese el nombre');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Ingrese el apellido');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Ingrese un correo electrónico válido');
      return false;
    }
    if (!password || password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!role) {
      Alert.alert('Error', 'Seleccione un rol');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
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
        'Usuario creado correctamente',
        [{ text: 'OK', onPress: () => router.replace('/users') }]
      );
    } catch (error: any) {
      console.error('Error creating user:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Stack.Screen
          options={{
            title: 'Nuevo Usuario',
            headerShown: true,
          }}
        />

        <View style={styles.form}>
          {/* First Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese el nombre"
              placeholderTextColor="#9ca3af"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Apellido <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese el apellido"
              placeholderTextColor="#9ca3af"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="999 999 999"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña <Text style={styles.required}>*</Text></Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                secureTextEntry={!showPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rol <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setShowRolePicker(!showRolePicker)}
            >
              <Text style={role ? styles.selectText : styles.placeholderText}>
                {role ? ROLE_OPTIONS.find(r => r.value === role)?.label : 'Seleccionar rol'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>

            {showRolePicker && (
              <View style={styles.pickerDropdown}>
                {ROLE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.pickerItem}
                    onPress={() => {
                      setRole(option.value);
                      setShowRolePicker(false);
                    }}
                  >
                    <View style={styles.pickerItemContent}>
                      <MaterialCommunityIcons
                        name={option.value === 'ADMIN' ? 'shield-account' : 'account-wrench'}
                        size={20}
                        color={option.value === 'ADMIN' ? '#8B5CF6' : '#3B82F6'}
                      />
                      <Text style={styles.pickerItemText}>{option.label}</Text>
                    </View>
                    {role === option.value && (
                      <MaterialCommunityIcons name="check" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  select: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectText: {
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  pickerDropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
