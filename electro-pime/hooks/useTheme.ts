import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../constants/theme';
import { useThemeContext } from '../contexts/ThemeContext';

export type ColorScheme = 'light' | 'dark';

export function useTheme(): { theme: Theme; colorScheme: ColorScheme } {
  const ctx = useThemeContext();
  const systemScheme = useColorScheme() ?? 'light';

  if (ctx) {
    return {
      theme: ctx.theme,
      colorScheme: ctx.colorScheme,
    };
  }

  return {
    theme: systemScheme === 'dark' ? darkTheme : lightTheme,
    colorScheme: systemScheme,
  };
}

export function useThemeColors() {
  const { theme } = useTheme();
  return theme;
}
