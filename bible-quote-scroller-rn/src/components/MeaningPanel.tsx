// ============================================================
// MeaningPanel — Bottom sheet for AI verse explanations
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { getMeaning } from '../services/MeaningService';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import type { FeedCard } from '../types';

interface Props {
  card: FeedCard | null;
  onClose: () => void;
}

export default function MeaningPanel({ card, onClose }: Props) {
  const [meaning, setMeaning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!card) {
      setMeaning(null);
      return;
    }

    setLoading(true);
    getMeaning(card.id, card.text, card.reference)
      .then(setMeaning)
      .catch(() => setMeaning('Unable to load meaning right now.'))
      .finally(() => setLoading(false));
  }, [card]);

  if (!card) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={!!card}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle bar */}
              <View style={styles.handle} />

              {/* Verse reference */}
              <Text style={styles.reference}>{card.reference}</Text>

              {/* Meaning content */}
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.accentPlatinum}
                  style={{ marginVertical: SPACING.xl }}
                />
              ) : (
                <Text style={styles.meaning}>{meaning}</Text>
              )}

              {/* Close button */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  reference: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.accentPlatinum,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  meaning: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
    marginBottom: SPACING.lg,
  },
  closeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
