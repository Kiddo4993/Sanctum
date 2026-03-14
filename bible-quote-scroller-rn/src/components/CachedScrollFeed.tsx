// ============================================================
// CachedScrollFeed — Example integration component
//
// Demonstrates how all caching services work together:
//   • QuoteService for verse caching
//   • MeaningService for AI meaning caching
//   • LikeService for optimistic like toggling
//   • AudioService for TTS audio caching
//   • CacheManager for local offline data
//
// This is a reference implementation showing how to wire
// everything up. Adapt and integrate into your actual UI.
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import RenderHtml from 'react-native-render-html';

// Services
import { getVerse, VERSE_POOL } from '../services/QuoteService';
import { getMeaning } from '../services/MeaningService';
import { toggleLike, isLiked, initLikeService } from '../services/LikeService';
import { getAudio } from '../services/AudioService';
import { loadRecentQuotes } from '../services/CacheManager';

// Existing services (JS interop)
import { getNextVerseId, sessionState, recordInteraction } from '../services/algorithm';

// Theme
import { COLORS, FONTS } from '../theme';

const { width, height } = Dimensions.get('window');

// Placeholder user ID — replace with real auth when available
const CURRENT_USER_ID = 'guest';

// ── Types ───────────────────────────────────────────────────

interface FeedCard {
  uniqueId: string;
  id: string;
  reference: string;
  content: string;
  genre: string;
  meaningText?: string;
  showMeaning: boolean;
  liked: boolean;
}

// ── Component ───────────────────────────────────────────────

export default function CachedScrollFeed() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showLoginNudge, setShowLoginNudge] = useState(false);
  const fetchingRef = useRef(false);

  // Initialise caching services on mount
  useEffect(() => {
    async function init() {
      // Initialise the like service (loads cached likes, starts background sync)
      await initLikeService(CURRENT_USER_ID);

      // Try to load cached quotes first for instant display
      const cached = await loadRecentQuotes();
      if (cached.length > 0) {
        const cachedCards: FeedCard[] = cached.slice(0, 3).map((q) => ({
          uniqueId: `${q.id}-cached-${Date.now()}`,
          id: q.id,
          reference: `${q.book} ${q.chapter}:${q.verse}`,
          content: `<p>${q.text}</p>`,
          genre: q.category ?? 'gospels',
          showMeaning: false,
          liked: isLiked(q.id),
        }));
        setCards(cachedCards);
        setLoadingInitial(false);
      }

      // Then fetch fresh verses
      await loadNext();
      await loadNext();
      await loadNext();
      setLoadingInitial(false);
    }

    init();
  }, []);

  // ── Load next verse via QuoteService (with caching) ───────
  const loadNext = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const { verseId, genre } = getNextVerseId();

      // This call checks Supabase cache first, then Bible API
      const verse = await getVerse(verseId);

      setCards((prev) => {
        const uniqueId = `${verse.id}-${Date.now()}`;
        return [
          ...prev,
          {
            uniqueId,
            id: verse.id,
            reference: verse.reference,
            content: verse.content,
            genre,
            showMeaning: false,
            liked: isLiked(verse.id),
          },
        ];
      });

      if (sessionState.scrollCount === 10) {
        setShowLoginNudge(true);
      }
    } catch (e) {
      console.error('[CachedScrollFeed] Failed to load verse:', e);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // ── Tap to show AI meaning ────────────────────────────────
  const handleTapMeaning = useCallback(async (card: FeedCard) => {
    // If meaning already loaded, just toggle visibility
    if (card.meaningText) {
      setCards((prev) =>
        prev.map((c) =>
          c.uniqueId === card.uniqueId ? { ...c, showMeaning: !c.showMeaning } : c
        )
      );
      return;
    }

    // Fetch meaning (checks cache first, then generates via OpenAI)
    const plainText = card.content.replace(/<[^>]*>/g, '').trim();
    const meaning = await getMeaning(card.id, plainText, card.reference);

    setCards((prev) =>
      prev.map((c) =>
        c.uniqueId === card.uniqueId
          ? { ...c, meaningText: meaning, showMeaning: true }
          : c
      )
    );
  }, []);

  // ── Like button handler ───────────────────────────────────
  const handleLike = useCallback(async (card: FeedCard) => {
    // Optimistic: update UI immediately
    const newLiked = await toggleLike(CURRENT_USER_ID, card.id);

    setCards((prev) =>
      prev.map((c) =>
        c.uniqueId === card.uniqueId ? { ...c, liked: newLiked } : c
      )
    );
  }, []);

  // ── Play audio ────────────────────────────────────────────
  const handlePlayAudio = useCallback(async (card: FeedCard) => {
    const plainText = card.content.replace(/<[^>]*>/g, '').trim();
    const audio = await getAudio(card.id, plainText);

    if (audio.publicUrl) {
      // In a real implementation, use expo-av to play the audio
      console.log(`[CachedScrollFeed] Would play audio from: ${audio.publicUrl}`);
    }
  }, []);

  // ── Render a single card ──────────────────────────────────
  const renderCard = ({ item }: { item: FeedCard }) => {
    const tagsStyles = {
      p: {
        color: COLORS.textPrimary,
        fontFamily: FONTS.serifItalic,
        fontSize: width > 600 ? 32 : 24,
        lineHeight: width > 600 ? 44 : 34,
        textAlign: 'center' as const,
        marginBottom: 24,
        fontStyle: 'italic' as const,
      },
    };

    return (
      <TouchableWithoutFeedback onPress={() => handleTapMeaning(item)}>
        <View style={styles.cardContainer}>
          <View style={styles.contentWrapper}>
            {/* Verse text */}
            <RenderHtml
              contentWidth={width - 64}
              source={{ html: item.content }}
              tagsStyles={tagsStyles}
            />
            <Text style={styles.referenceText}>{item.reference}</Text>

            {/* AI Meaning (shows on tap) */}
            {item.showMeaning && item.meaningText && (
              <View style={styles.meaningContainer}>
                <Text style={styles.meaningText}>{item.meaningText}</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleLike(item)}
                style={styles.actionButton}
              >
                <Text style={[styles.actionIcon, item.liked && styles.likedIcon]}>
                  {item.liked ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePlayAudio(item)}
                style={styles.actionButton}
              >
                <Text style={styles.actionIcon}>🔊</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // ── Dwell time tracking (3s = implicit interest) ──────────
  const dwellTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ key: string; item: FeedCard }> }) => {
      const currentlyViewableIds = new Set(viewableItems.map((v) => v.key));

      for (const [id, timer] of dwellTimers.current.entries()) {
        if (!currentlyViewableIds.has(id)) {
          clearTimeout(timer);
          dwellTimers.current.delete(id);
        }
      }

      viewableItems.forEach(({ item }) => {
        if (!dwellTimers.current.has(item.uniqueId)) {
          const timer = setTimeout(() => {
            recordInteraction(item.genre);
          }, 3000);
          dwellTimers.current.set(item.uniqueId, timer);
        }
      });
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 100,
  };

  // ── Layout ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {loadingInitial ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentGold} />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.uniqueId}
          renderItem={renderCard}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onEndReached={loadNext}
          onEndReachedThreshold={1.5}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews
          initialNumToRender={3}
          windowSize={5}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
        />
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  cardContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  contentWrapper: {
    maxWidth: 800,
    width: '100%',
    alignItems: 'center',
  },
  referenceText: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  meaningContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  meaningText: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 24,
  },
  actionButton: {
    padding: 12,
  },
  actionIcon: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  likedIcon: {
    color: '#E74C3C',
  },
});
