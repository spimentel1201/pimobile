import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radii } from '../../constants/theme';

interface SkeletonLoaderProps {
  lines?: number;
  lineHeight?: number;
  borderRadius?: number;
}

export function SkeletonLoader({
  lines = 3,
  lineHeight = 16,
  borderRadius = 4,
}: SkeletonLoaderProps) {
  const { theme } = useTheme();
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.line,
            {
              height: lineHeight,
              borderRadius,
              backgroundColor: theme.skeleton,
              opacity,
              width: i === lines - 1 ? '60%' : '100%',
              marginBottom: i < lines - 1 ? spacing.sm : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
  },
  line: {
    width: '100%',
  },
});
