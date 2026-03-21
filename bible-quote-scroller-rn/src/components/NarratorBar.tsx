// ============================================================
// NarratorBar — Fixed bottom bar for TTS playback
//
// Features: play/pause, speed control (1x/1.5x/2x), voice info
// Uses expo-av for audio playback.
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

interface Props {
  audioUrl: string | null;
  reference: string;
  onClose: () => void;
}

const SPEEDS = [1, 1.5, 2] as const;

export default function NarratorBar({ audioUrl, reference, onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const togglePlayPause = useCallback(async () => {
    if (!audioUrl) return;

    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        stopPulse();
        return;
      }

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { rate: SPEEDS[speedIndex], shouldPlay: true }
        );
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            setIsPlaying(false);
            stopPulse();
            soundRef.current = null;
          }
        });
      } else {
        await soundRef.current.playAsync();
      }

      setIsPlaying(true);
      startPulse();
    } catch (err) {
      console.warn('[NarratorBar] Playback error:', err);
    }
  }, [audioUrl, isPlaying, speedIndex, startPulse, stopPulse]);

  const cycleSpeed = useCallback(async () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (soundRef.current) {
      await soundRef.current.setRateAsync(SPEEDS[next], true);
    }
  }, [speedIndex]);

  if (!audioUrl) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {/* Play/Pause */}
        <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn}>
          <Animated.Text style={[styles.playIcon, { transform: [{ scale: pulseAnim }] }]}>
            {isPlaying ? '⏸' : '▶'}
          </Animated.Text>
        </TouchableOpacity>

        {/* Reference label */}
        <Text style={styles.label} numberOfLines={1}>
          {reference}
        </Text>

        {/* Speed control */}
        <TouchableOpacity onPress={cycleSpeed} style={styles.speedBtn}>
          <Text style={styles.speedText}>{SPEEDS[speedIndex]}×</Text>
        </TouchableOpacity>

        {/* Close */}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // above tab bar
    left: SPACING.md,
    right: SPACING.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  playBtn: { padding: SPACING.sm },
  playIcon: { fontSize: 20, color: COLORS.accentPlatinum },
  label: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  speedBtn: {
    backgroundColor: COLORS.accentPlatinumDim,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  speedText: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    color: COLORS.accentPlatinum,
  },
  closeBtn: { padding: SPACING.sm },
  closeIcon: { fontSize: 14, color: COLORS.textMuted },
});
