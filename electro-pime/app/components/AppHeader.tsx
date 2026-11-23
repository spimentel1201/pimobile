// ponytail: M3 Top App Bar with back button, ripple and safe insets
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  headerRight?: React.ReactNode;
  rightAction?: React.ReactNode;
};

export default function AppHeader({
  title,
  subtitle,
  showBackButton = false,
  showBack,
  onBackPress,
  headerRight,
  rightAction,
}: AppHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const hasBack = showBack ?? showBackButton;
  const rightContent = rightAction ?? headerRight;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.contentRow}>
        {hasBack && (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            android_ripple={{ color: 'rgba(0, 82, 255, 0.12)', borderless: true, radius: 24 }}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 199, 208, 0.3)',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
    borderRadius: radii.full,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
