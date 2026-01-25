import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { secureStorage } from '../utils/storage';
import { api } from '../services/api';
import { User, LoginCredentials, RegisterData } from '../types/api';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const TOKEN_KEY = 'auth_token';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const token = await secureStorage.getItem(TOKEN_KEY);
      if (token) {
        api.setToken(token);
        try {
          const userData = await api.getProfile();
          setUser(userData);
        } catch (profileError) {
          console.error('Token invalid or expired:', profileError);
          // Token is invalid, clear it
          await secureStorage.deleteItem(TOKEN_KEY);
          api.setToken('');
        }
      }
    } catch (error) {
      console.error('Failed to load user from storage', error);
      await secureStorage.deleteItem(TOKEN_KEY);
      api.setToken('');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.login(credentials);
      const token = response.access_token;

      // Store token
      await secureStorage.setItem(TOKEN_KEY, token);
      api.setToken(token);

      // If response includes user, use it; otherwise fetch profile
      if (response.user) {
        setUser(response.user);
      } else {
        // Fetch user profile with the new token
        const userData = await api.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data);
      const token = response.access_token;

      // Store token
      await secureStorage.setItem(TOKEN_KEY, token);
      api.setToken(token);

      // If response includes user, use it; otherwise fetch profile
      if (response.user) {
        setUser(response.user);
      } else {
        const userData = await api.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await secureStorage.deleteItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to logout token removal', error);
    } finally {
      api.setToken('');
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
