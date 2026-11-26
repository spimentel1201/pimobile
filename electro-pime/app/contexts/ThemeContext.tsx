import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { applyColorScheme, type ThemePreference } from '../theme';

const STORAGE_KEY = 'electropime_theme_preference';

interface ThemeContextValue {
  /** Si el tema efectivo es oscuro. */
  isDark: boolean;
  /** Preferencia del usuario: sistema / claro / oscuro. */
  preference: ThemePreference;
  /** Cambia la preferencia y la persiste. */
  setPreference: (pref: ThemePreference) => void;
  /** Si está siguiendo la configuración del sistema. */
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  // Cargar preferencia persistida
  useEffect(() => {
    (async () => {
      try {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          const stored = await SecureStore.getItemAsync(STORAGE_KEY);
          if (stored === 'light' || stored === 'dark' || stored === 'system') {
            setPreferenceState(stored);
          }
        }
      } catch {
        // Ignorar: se usa el valor por defecto
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const isDark =
    preference === 'system'
      ? systemScheme === 'dark'
      : preference === 'dark';

  // Aplicar la paleta durante el render (no en un efecto diferido) para que
  // el primer render de cada pantalla ya use los colores correctos.
  useMemo(() => applyColorScheme(isDark), [isDark]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    (async () => {
      try {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          await SecureStore.setItemAsync(STORAGE_KEY, pref);
        }
      } catch {
        // Ignorar errores de persistencia
      }
    })();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      preference,
      setPreference,
      isSystem: preference === 'system',
    }),
    [isDark, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback por si se usa fuera del provider
    return {
      isDark: false,
      preference: 'system',
      setPreference: () => {},
      isSystem: true,
    };
  }
  return ctx;
}