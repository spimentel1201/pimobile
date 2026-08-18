import { lightTheme, darkTheme } from './theme';

export const Colors = {
  light: {
    text: lightTheme.text,
    background: lightTheme.background,
    tint: lightTheme.primary,
    icon: lightTheme.textSecondary,
    tabIconDefault: lightTheme.textMuted,
    tabIconSelected: lightTheme.primary,
  },
  dark: {
    text: darkTheme.text,
    background: darkTheme.background,
    tint: darkTheme.primary,
    icon: darkTheme.textSecondary,
    tabIconDefault: darkTheme.textMuted,
    tabIconSelected: darkTheme.primary,
  },
};
