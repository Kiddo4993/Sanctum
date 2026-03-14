// ============================================================
// Saved Screen — Grid of saved verses
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSavedQuotes } from '../../src/services/SaveService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme';
import type { Quote } from '../../src/types';

const GUEST_ID = 'guest';

export default function SavedScreen() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<(Quote & { saved_at: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const data = await getSavedQuotes(GUEST_ID);
      const mapped = data.map((row: any) => ({
        ...row.quotes,
        saved_at: row.created_at,
      }));
      setQuotes(mapped);
    } catch {
      // Offline — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSaved();
  }, [fetchSaved]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accentGold} />
      </View>
    );
  }

  if (quotes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>☆</Text>
        <Text style={styles.emptyTitle}>No saved verses yet</Text>
        <Text style={styles.emptyBody}>
          Tap the star on any verse to save it here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Verses</Text>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        numColumns={1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accentGold}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/meaning/${item.id}`)}
          >
            <Text style={styles.verseText} numberOfLines={3}>
              "{item.text}"
            </Text>
            <Text style={styles.reference}>
              {item.book} {item.chapter}:{item.verse}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  header: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  verseText: {
    fontFamily: FONTS.serifItalic,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  reference: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emptyIcon: { fontSize: 48, color: COLORS.textMuted, marginBottom: SPACING.md },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyBody: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
