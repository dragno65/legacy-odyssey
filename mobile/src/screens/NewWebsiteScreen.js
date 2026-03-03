import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { post } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function NewWebsiteScreen({ navigation }) {
  const { refreshFamilies, switchFamily } = useAuth();
  const [subdomain, setSubdomain] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  async function handleCreate() {
    if (!cleanSubdomain && !customDomain.trim()) {
      Alert.alert('Required', 'Please enter a subdomain or custom domain.');
      return;
    }
    if (cleanSubdomain && cleanSubdomain.length < 3) {
      Alert.alert('Too Short', 'Subdomain must be at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await post('/api/families', {
        subdomain: cleanSubdomain || null,
        displayName: displayName.trim() || 'New Website',
        customDomain: customDomain.trim() || null,
      });

      const newFamily = res.data.family;

      // Refresh families list and switch to new family
      await refreshFamilies();
      await switchFamily(newFamily.id);

      Alert.alert(
        'Website Created!',
        `Your new website is ready. Start editing your book!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
      );
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create website.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create a New Website</Text>
        <Text style={styles.subtitle}>
          Add another baby book website to your account.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Baby Smith's Book"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.hint}>A friendly name for this website</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Subdomain</Text>
          <View style={styles.subdomainRow}>
            <TextInput
              style={[styles.input, styles.subdomainInput]}
              value={subdomain}
              onChangeText={setSubdomain}
              placeholder="babyjohn"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.subdomainSuffix}>.legacyodyssey.com</Text>
          </View>
          {cleanSubdomain ? (
            <Text style={styles.hint}>
              Website: {cleanSubdomain}.legacyodyssey.com
            </Text>
          ) : null}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Custom Domain (optional)</Text>
          <TextInput
            style={styles.input}
            value={customDomain}
            onChangeText={setCustomDomain}
            placeholder="e.g. www.babysmith.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            You can set up a custom domain later in Settings
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.dark} />
          ) : (
            <Text style={styles.createButtonText}>Create Website</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  subdomainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subdomainInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  subdomainSuffix: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopRightRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  createButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.card,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.dark,
  },
});
