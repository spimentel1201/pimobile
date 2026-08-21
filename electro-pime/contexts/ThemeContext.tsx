import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../constants/theme';
import { secureStorage } from '../utils/storage';

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: 'light' | 'dark';
  themePreference: ColorScheme;
  setThemePreference: (pref: ColorScheme) => void;
  isDark: boolean;
}

const STORAGE_KEY = 'theme_preference';

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  colorScheme: 'light',
  themePreference: 'system',
  setThemePreference: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [preference, setPreference] = useState<ColorScheme>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    secureStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreference(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setThemePreference = useCallback((pref: ColorScheme) => {
    setPreference(pref);
    secureStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const resolvedScheme = preference === 'system' ? systemScheme : preference;
  const isDark = resolvedScheme === 'dark';

  const value: ThemeContextValue = {
    theme: isDark ? darkTheme : lightTheme,
    colorScheme: resolvedScheme,
    themePreference: preference,
    setThemePreference,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
