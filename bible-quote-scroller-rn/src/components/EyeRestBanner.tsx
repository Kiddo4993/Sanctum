// ============================================================
// EyeRestBanner — Gentle reminder after 60 minutes of use
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

const ONE_HOUR_MS = 60 * 60 * 1000;

export default function EyeRestBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), ONE_HOUR_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🕊</Text>
          <Text style={styles.title}>Time to Rest Your Eyes</Text>
          <Text style={styles.body}>
            You've been reading for an hour.{'\n'}
            Take a moment to look away, breathe, and reflect.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={() => setVisible(false)}>
            <Text style={styles.btnText}>Resume Reading</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  emoji: { fontSize: 40, marginBottom: SPACING.md },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: COLORS.accentPlatinum,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 16,
    color: '#000',
  },
});
