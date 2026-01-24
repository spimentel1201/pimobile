import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from './contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro que desea cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'account-circle', label: 'Mi Perfil', onPress: () => { } },
    { icon: 'cog', label: 'Configuración', onPress: () => { } },
    { icon: 'shield-account', label: 'Privacidad', onPress: () => { } },
    { icon: 'help-circle', label: 'Ayuda y Soporte', onPress: () => { } },
    { icon: 'logout', label: 'Cerrar Sesión', onPress: handleLogout, isLogout: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email || 'usuario@ejemplo.com'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'Usuario'}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, item.isLogout && styles.menuItemLogout]}
            onPress={item.onPress}
          >
            <View style={[styles.menuIcon, item.isLogout && styles.menuIconLogout]}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={24}
                color={item.isLogout ? '#EF4444' : '#4b5563'}
              />
            </View>
            <Text style={[styles.menuText, item.isLogout && styles.menuTextLogout]}>
              {item.label}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={item.isLogout ? '#EF4444' : '#9ca3af'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 24,
    alignItems: 'center',
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  menuContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemLogout: {
    borderBottomWidth: 0,
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
  },
  menuIconLogout: {},
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  menuTextLogout: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
