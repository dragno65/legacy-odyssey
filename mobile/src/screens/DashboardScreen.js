import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import { get } from '../api/client';

const SECTIONS = [
  { key: 'childInfo', title: 'Welcome / Child Info', icon: '\u{1F476}', screen: 'ChildInfo' },
  { key: 'before', title: 'Before You Arrived', icon: '\u{1F31F}', screen: 'BeforeArrived' },
  { key: 'birth', title: 'Birth Story', icon: '\u{1F382}', screen: 'BirthStory' },
  { key: 'comingHome', title: 'Coming Home', icon: '\u{1F3E0}', screen: 'ComingHome' },
  { key: 'months', title: 'Month by Month', icon: '\u{1F4C5}', screen: 'Months' },
  { key: 'family', title: 'Our Family', icon: '\u{1F46A}', screen: 'OurFamily' },
  { key: 'firsts', title: 'Your Firsts', icon: '\u{2B50}', screen: 'YourFirsts' },
  { key: 'celebrations', title: 'Celebrations', icon: '\u{1F389}', screen: 'Celebrations' },
  { key: 'letters', title: 'Letters to You', icon: '\u{1F48C}', screen: 'Letters' },
  { key: 'recipes', title: 'Family Recipes', icon: '\u{1F373}', screen: 'FamilyRecipes' },
  { key: 'vault', title: 'The Vault', icon: '\u{1F512}', screen: 'TheVault' },
  { key: 'settings', title: 'Settings', icon: '\u{2699}\u{FE0F}', screen: 'Settings' },
];

export default function DashboardScreen({ navigation }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function fetchBook() {
    try {
      setError('');
      const res = await get('/api/books/mine');
      setBook(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load book data.');
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchBook().finally(() => setLoading(false));
  }, []);

  // Refetch on focus (returning from an editor)
  useFocusEffect(
    useCallback(() => {
      fetchBook();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchBook();
    setRefreshing(false);
  }

  function getChildName() {
    if (!book) return '';
    const child = book.child || book.childInfo || {};
    const first = child.first_name || child.firstName || '';
    const last = child.last_name || child.lastName || '';
    if (first || last) return `${first} ${last}`.trim();
    return '';
  }

  function renderSectionCard({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate(item.screen, { book })}
      >
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardAction}>Edit</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading your book...</Text>
      </View>
    );
  }

  const childName = getChildName();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Legacy Odyssey</Text>
        {childName ? (
          <Text style={styles.headerSubtitle}>{childName}'s Book</Text>
        ) : (
          <Text style={styles.headerSubtitle}>Your Family's Story</Text>
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Section Grid */}
      <FlatList
        data={SECTIONS}
        renderItem={renderSectionCard}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.serif,
  },
  header: {
    backgroundColor: colors.dark,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.md,
    color: colors.goldLight,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
  },
  retryText: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  grid: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    width: '48%',
    alignItems: 'center',
    ...shadows.card,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardAction: {
    fontSize: typography.sizes.xs,
    color: colors.gold,
    fontWeight: typography.weights.medium,
  },
});
