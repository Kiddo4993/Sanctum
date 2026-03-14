// ============================================================
// ScrollFeed — Main vertical snap-scroll feed
//
// Features:
//   • FlatList with snap-to-page scrolling (100vh cards)
//   • Preloads next verses as user scrolls
//   • Dwell time tracking (3s = implicit interest)
//   • Triggers login nudge after 10 scrolls
//   • Optimistic like/save via services
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import QuoteCard from './QuoteCard';
import MeaningPanel from './MeaningPanel';
import LoginNudge from './LoginNudge';
import EyeRestBanner from './EyeRestBanner';
import { getVerse } from '../services/QuoteService';
import { getNextVerseId, sessionState, recordInteraction } from '../services/AlgorithmService';
import { toggleLike, isLiked, initLikeService } from '../services/LikeService';
import { toggleSave, isSaved, initSaveService } from '../services/SaveService';
import { loadRecentQuotes } from '../services/CacheManager';
import { COLORS } from '../theme';
import type { FeedCard } from '../types';

const { height } = Dimensions.get('window');

// Guest user ID — replaced with real auth when user logs in
const GUEST_ID = 'guest';

export default function ScrollFeed() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginNudge, setShowLoginNudge] = useState(false);
  const [meaningCard, setMeaningCard] = useState<FeedCard | null>(null);
  const fetchingRef = useRef(false);

  // Init services & load cached data
  useEffect(() => {
    async function init() {
      await initLikeService(GUEST_ID);
      await initSaveService(GUEST_ID);

      // Show cached quotes instantly
      const cached = await loadRecentQuotes();
      if (cached.length > 0) {
        const cachedCards: FeedCard[] = cached.slice(0, 3).map((q) => ({
          uniqueId: `${q.id}-cached-${Date.now()}`,
          id: q.id,
          bibleApiId: q.bible_api_id,
          reference: `${q.book} ${q.chapter}:${q.verse}`,
          content: `<p>${q.text}</p>`,
          text: q.text,
          genre: q.category ?? 'gospels',
          liked: isLiked(q.id),
          saved: isSaved(q.id),
        }));
        setCards(cachedCards);
        setLoading(false);
      }

      // Fetch fresh verses
      for (let i = 0; i < 3; i++) await loadNext();
      setLoading(false);
    }
    init();
  }, []);

  const loadNext = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const { verseId, genre } = getNextVerseId();
      const verse = await getVerse(verseId);
      const plainText = verse.content.replace(/<[^>]*>/g, '').trim();

      setCards((prev) => [
        ...prev,
        {
          uniqueId: `${verse.id}-${Date.now()}`,
          id: verse.id,
          bibleApiId: verseId,
          reference: verse.reference,
          content: verse.content,
          text: plainText,
          genre,
          liked: isLiked(verse.id),
          saved: isSaved(verse.id),
        },
      ]);

      if (sessionState.scrollCount === 10) setShowLoginNudge(true);
    } catch (e) {
      console.error('[ScrollFeed] Failed to load verse:', e);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Like / Save / Meaning / Audio handlers
  const handleToggleLike = useCallback(async (card: FeedCard) => {
    const newState = await toggleLike(GUEST_ID, card.id);
    setCards((prev) =>
      prev.map((c) => (c.uniqueId === card.uniqueId ? { ...c, liked: newState } : c))
    );
  }, []);

  const handleToggleSave = useCallback(async (card: FeedCard) => {
    const newState = await toggleSave(GUEST_ID, card.id);
    setCards((prev) =>
      prev.map((c) => (c.uniqueId === card.uniqueId ? { ...c, saved: newState } : c))
    );
  }, []);

  const handleTapMeaning = useCallback((card: FeedCard) => {
    setMeaningCard(card);
  }, []);

  const handlePlayAudio = useCallback((_card: FeedCard) => {
    // TODO: integrated in Phase 3 with NarratorBar + expo-av
    console.log('[ScrollFeed] Audio playback coming soon');
  }, []);

  // Dwell time tracking
  const dwellTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ key: string; item: FeedCard }> }) => {
      const viewableIds = new Set(viewableItems.map((v) => v.key));

      for (const [id, timer] of dwellTimers.current.entries()) {
        if (!viewableIds.has(id)) {
          clearTimeout(timer);
          dwellTimers.current.delete(id);
        }
      }

      viewableItems.forEach(({ item }) => {
        if (!dwellTimers.current.has(item.uniqueId)) {
          const timer = setTimeout(() => recordInteraction(item.genre), 3000);
          dwellTimers.current.set(item.uniqueId, timer);
        }
      });
    },
    []
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60, minimumViewTime: 100 });

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.accentGold} />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.uniqueId}
          renderItem={({ item }) => (
            <QuoteCard
              card={item}
              onTapMeaning={handleTapMeaning}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onPlayAudio={handlePlayAudio}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onEndReached={loadNext}
          onEndReachedThreshold={1.5}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          removeClippedSubviews
          initialNumToRender={3}
          windowSize={5}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
        />
      )}

      <LoginNudge visible={showLoginNudge} onClose={() => setShowLoginNudge(false)} />
      <EyeRestBanner />
      <MeaningPanel card={meaningCard} onClose={() => setMeaningCard(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
