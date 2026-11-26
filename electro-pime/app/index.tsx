import { Redirect } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from './theme';
import React, { useMemo } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [isDark]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect based on auth state
  if (user) {
    return <Redirect href="/dashboard" />;
  } else {
    return <Redirect href="/login" />;
  }
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
});