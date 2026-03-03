import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { get, put } from '../api/client';

const SECTION_TOGGLES = [
  { key: 'before', label: 'Before You Arrived', icon: '\u{1F31F}' },
  { key: 'birth', label: 'Birth Story', icon: '\u{1F338}' },
  { key: 'home', label: 'Coming Home', icon: '\u{1F3E0}' },
  { key: 'months', label: 'Month by Month', icon: '\u{1F4C5}' },
  { key: 'family', label: 'Our Family', icon: '\u{1F46A}' },
  { key: 'firsts', label: 'Your Firsts', icon: '\u{2B50}' },
  { key: 'holidays', label: 'Celebrations', icon: '\u{1F389}' },
  { key: 'letters', label: 'Letters to You', icon: '\u{1F48C}' },
  { key: 'recipes', label: 'Family Recipes', icon: '\u{1F373}' },
  { key: 'vault', label: 'The Vault', icon: '\u{1F512}' },
];

export default function ManageSectionsScreen() {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key of section currently saving
  const [refreshing, setRefreshing] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      const res = await get('/api/books/mine/sections');
      setSections(res.data || {});
    } catch (err) {
      Alert.alert('Error', 'Could not load section settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  async function toggleSection(key, value) {
    // Optimistic update
    setSections((prev) => ({ ...prev, [key]: value }));
    setSaving(key);

    try {
      const res = await put('/api/books/mine/sections', { [key]: value });
      // Update with server response (source of truth)
      setSections(res.data || {});
    } catch (err) {
      // Revert on failure
      setSections((prev) => ({ ...prev, [key]: !value }));
      Alert.alert('Error', 'Could not update section visibility.');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading sections...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchSections();
          }}
          tintColor={colors.gold}
        />
      }
    >
      <Text style={styles.headerTitle}>Website Sections</Text>
      <Text style={styles.headerSubtitle}>
        Choose which sections appear on your public website. Sections are
        automatically shown when you add content, but you can toggle them
        on or off here.
      </Text>

      <View style={styles.sectionsList}>
        {SECTION_TOGGLES.map((item) => (
          <View key={item.key} style={styles.sectionRow}>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionIcon}>{item.icon}</Text>
              <Text style={styles.sectionLabel}>{item.label}</Text>
            </View>
            <View style={styles.sectionControl}>
              {saving === item.key && (
                <ActivityIndicator
                  size="small"
                  color={colors.gold}
                  style={styles.savingIndicator}
                />
              )}
              <Switch
                value={sections[item.key] === true}
                onValueChange={(val) => toggleSection(item.key, val)}
                trackColor={{ false: colors.border, true: colors.goldLight }}
                thumbColor={
                  sections[item.key] ? colors.gold : colors.placeholder
                }
                disabled={saving !== null}
              />
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footerNote}>
        Sections that are turned off will not appear in the navigation or
        content of your book website.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.serif,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  sectionsList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 22,
    marginRight: spacing.md,
    width: 30,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  sectionControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingIndicator: {
    marginRight: spacing.sm,
  },
  footerNote: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
