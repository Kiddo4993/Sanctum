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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
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
            contentWidth={width - 100} // leave room for right buttons
            source={{ html: card.content }}
            tagsStyles={tagsStyles}
          />

          {/* Reference */}
          <Text style={styles.reference}>{card.reference}</Text>
        </View>

        {/* Action Buttons - Tiktok Style Right Side */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onToggleLike(card)} style={styles.actionBtn}>
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={card.liked ? "heart" : "heart-outline"} 
                size={28} 
                color={card.liked ? COLORS.danger : COLORS.textPrimary} 
              />
            </View>
            <Text style={styles.actionLabel}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onToggleSave(card)} style={styles.actionBtn}>
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={card.saved ? "bookmark" : "bookmark-outline"} 
                size={26} 
                color={card.saved ? COLORS.accentPlatinum : COLORS.textPrimary} 
              />
            </View>
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <View style={styles.iconWrapper}>
              <Ionicons name="share-social-outline" size={26} color={COLORS.textPrimary} />
            </View>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPlayAudio(card)} style={styles.actionBtn}>
            <View style={styles.iconWrapper}>
              <Ionicons name="volume-high-outline" size={28} color={COLORS.textPrimary} />
            </View>
            <Text style={styles.actionLabel}>Audio</Text>
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Text style={styles.hint}>tap verse for meaning</Text>
        </View>
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
  },
  content: {
    maxWidth: 800,
    width: '100%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingRight: 40, // offset for right actions
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
    position: 'absolute',
    right: SPACING.lg,
    bottom: height * 0.2, // centered-ish vertically in the lower half
    alignItems: 'center',
    gap: SPACING.lg,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
  },
  hint: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

