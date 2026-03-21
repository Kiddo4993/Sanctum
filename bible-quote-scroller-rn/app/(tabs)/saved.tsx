// ============================================================
// Saved Screen — Grid of saved and liked verses
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
import { getLikedQuotes } from '../../src/services/LikeService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme';
import type { Quote } from '../../src/types';

const GUEST_ID = 'guest';

export default function SavedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'saved' | 'liked'>('saved');
  const [quotes, setQuotes] = useState<(Quote & { saved_at: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVerses = useCallback(async () => {
    setLoading(true);
    try {
      const data = activeTab === 'saved'
        ? await getSavedQuotes(GUEST_ID)
        : await getLikedQuotes(GUEST_ID);
        
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
  }, [activeTab]);

  useEffect(() => {
    fetchVerses();
  }, [fetchVerses, activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerses();
  }, [fetchVerses]);

  return (
    <View style={styles.container}>
      {/* Top Segmented Controls */}
      <View style={styles.topTabs}>
        <TouchableOpacity 
          style={[styles.topTab, activeTab === 'saved' && styles.activeTab]} 
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.topTabText, activeTab === 'saved' && styles.activeTabText]}>SAVED</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.topTab, activeTab === 'liked' && styles.activeTab]} 
          onPress={() => setActiveTab('liked')}
        >
          <Text style={[styles.topTabText, activeTab === 'liked' && styles.activeTabText]}>LIKED</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accentPlatinum} />
        </View>
      ) : quotes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{activeTab === 'saved' ? '☆' : '♡'}</Text>
          <Text style={styles.emptyTitle}>No {activeTab} verses yet</Text>
          <Text style={styles.emptyBody}>
            Tap the {activeTab === 'saved' ? 'bookmark' : 'heart'} on any verse to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          numColumns={1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accentPlatinum}
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
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
  },
  topTab: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.accentPlatinum,
  },
  topTabText: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  activeTabText: {
    color: COLORS.textPrimary,
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

