// ponytail: M3 Outlined Text Field with leading icon, helper text and error state
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextInputProps,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface M3TextFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  errorText?: string;
  leadingIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  leadingText?: string; // e.g. "S/" for Peruvian Sol
  trailingIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onTrailingIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function M3TextField({
  label,
  helperText,
  error,
  errorText,
  leadingIcon,
  leadingText,
  trailingIcon,
  onTrailingIconPress,
  containerStyle,
  style,
  ...props
}: M3TextFieldProps) {
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [isDark]);
  const [isFocused, setIsFocused] = useState(false);

  const activeError = error || errorText;
  const hasError = Boolean(activeError);
  const borderColor = hasError
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused, hasError && styles.labelError]}>
          {label}
        </Text>
      )}

      <View style={[styles.inputContainer, { borderColor }, isFocused && styles.inputFocused]}>
        {leadingIcon && (
          <MaterialCommunityIcons
            name={leadingIcon}
            size={20}
            color={hasError ? colors.danger : isFocused ? colors.primary : colors.textMuted}
            style={styles.leadingIcon}
          />
        )}
        {leadingText && !leadingIcon && (
          <Text style={[styles.leadingText, isFocused && styles.leadingTextFocused, hasError && styles.leadingTextError]}>
            {leadingText}
          </Text>
        )}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {trailingIcon && (
          <Pressable
            onPress={onTrailingIconPress}
            style={styles.trailingIcon}
            hitSlop={8}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 16 }}
          >
            <MaterialCommunityIcons
              name={trailingIcon}
              size={20}
              color={hasError ? colors.danger : colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {(activeError || helperText) && (
        <Text style={[styles.helper, hasError && styles.helperError]}>
          {activeError || helperText}
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  labelFocused: {
    color: colors.primary,
  },
  labelError: {
    color: colors.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radii.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderWidth: 2,
  },
  leadingIcon: {
    marginRight: spacing.sm,
  },
  leadingText: {
    ...typography.bodyLarge,
    color: colors.textMuted,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  leadingTextFocused: {
    color: colors.primary,
  },
  leadingTextError: {
    color: colors.danger,
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  trailingIcon: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  helper: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: spacing.xs,
  },
  helperError: {
    color: colors.danger,
    fontWeight: '500',
  },
});
