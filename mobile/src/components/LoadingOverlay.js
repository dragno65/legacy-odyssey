import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export default function LoadingOverlay({ message, visible = true }) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.gold} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: typography.fontFamily.serif,
  },
});
