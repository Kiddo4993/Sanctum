// ============================================================
// QuoteCard — Full-screen verse card with action buttons
//
// Displays one verse at a time with:
//   • Serif italic text (EB Garamond / Lora)
//   • Reference below (book chapter:verse)
//   • Like / Save / Share / Audio action buttons
//   • Tap-to-show-meaning (opens MeaningPanel)
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Share,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { COLORS, FONTS, SPACING } from '../theme';
import type { FeedCard } from '../types';

const { width, height } = Dimensions.get('window');

interface Props {
  card: FeedCard;
  onTapMeaning: (card: FeedCard) => void;
  onToggleLike: (card: FeedCard) => void;
  onToggleSave: (card: FeedCard) => void;
  onPlayAudio: (card: FeedCard) => void;
}

export default function QuoteCard({
  card,
  onTapMeaning,
  onToggleLike,
  onToggleSave,
  onPlayAudio,
}: Props) {
  const tagsStyles = {
    p: {
      color: COLORS.textPrimary,
      fontFamily: FONTS.serifItalic,
      fontSize: width > 600 ? 32 : 24,
      lineHeight: width > 600 ? 48 : 38,
      textAlign: 'center' as const,
      marginBottom: SPACING.lg,
      fontStyle: 'italic' as const,
    },
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${card.text}"\n— ${card.reference}\n\nShared from Sanctum`,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => onTapMeaning(card)}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Verse Text */}
          <RenderHtml
            contentWidth={width - 64}
            source={{ html: card.content }}
            tagsStyles={tagsStyles}
          />

          {/* Reference */}
          <Text style={styles.reference}>{card.reference}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onToggleLike(card)} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, card.liked && styles.likedIcon]}>
              {card.liked ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onToggleSave(card)} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, card.saved && styles.savedIcon]}>
              {card.saved ? '★' : '☆'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <Text style={styles.actionIcon}>↗</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPlayAudio(card)} style={styles.actionBtn}>
            <Text style={styles.actionIcon}>🔊</Text>
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <Text style={styles.hint}>tap verse for meaning</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  content: {
    maxWidth: 800,
    width: '100%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  reference: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  actionBtn: {
    padding: SPACING.md,
  },
  actionIcon: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  likedIcon: {
    color: COLORS.danger,
  },
  savedIcon: {
    color: COLORS.accentGold,
  },
  hint: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
