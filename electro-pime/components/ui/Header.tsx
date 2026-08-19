import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radii } from '../../constants/theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function Header({ title, showBack = false, rightAction, style }: HeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.headerBg,
          borderBottomColor: theme.headerBorder,
        },
        style,
      ]}
    >
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.surfaceVariant }]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  left: {
    width: 40,
    alignItems: 'flex-start',
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
