import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing, typography } from '../theme';
import { BASE_URL } from '../api/client';

export default function PreviewScreen({ route }) {
  const { slug } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Construct the book URL - the web book is served from the API host
  const bookUrl = slug
    ? `${BASE_URL}/book/${slug}`
    : `${BASE_URL}/book`;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading your book...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load book preview. Please check your connection and try again.
          </Text>
        </View>
      )}

      <WebView
        source={{ uri: bookUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        onHttpError={() => {
          setLoading(false);
          setError(true);
        }}
        startInLoadingState={false}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.serif,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
