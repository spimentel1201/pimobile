import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radii } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  showPasswordToggle,
  secureTextEntry,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const borderColor = error
    ? theme.text === '#F8FAFC' ? '#EF4444' : '#EF4444'
    : isFocused
    ? theme.inputBorderFocus
    : theme.inputBorder;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.inputBg,
            borderColor,
          },
          isFocused && styles.focused,
          error && styles.error,
        ]}
      >
        {leftIcon && (
          <View style={styles.iconLeft}>{leftIcon}</View>
        )}
        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || showPasswordToggle) ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconRight}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !showPasswordToggle && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>
      {(error || helperText) && (
        <Text
          style={[
            styles.helper,
            { color: error ? '#EF4444' : theme.textSecondary },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.base,
    minHeight: 48,
  },
  focused: {
    borderWidth: 2,
  },
  error: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.base,
    paddingVertical: spacing.sm,
  },
  inputWithLeftIcon: {
    marginLeft: spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: spacing.sm,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  helper: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
