import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../constants/theme';

export type ColorScheme = 'light' | 'dark';

export function useTheme(): { theme: Theme; colorScheme: ColorScheme } {
  const colorScheme = useColorScheme() ?? 'light';
  return {
    theme: colorScheme === 'dark' ? darkTheme : lightTheme,
    colorScheme,
  };
}

export function useThemeColors() {
  const { theme } = useTheme();
  return theme;
}
