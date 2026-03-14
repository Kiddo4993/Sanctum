// ============================================================
// LoginNudge — Gentle sign-up prompt after 10 scrolls
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LoginNudge({ visible, onClose }: Props) {
  const router = useRouter();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <Text style={styles.title}>Want to save your journey?</Text>
              <Text style={styles.description}>
                Sign up to like, save, and share verses — and carry your personalized feed across devices.
              </Text>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    onClose();
                    router.push('/auth/signup');
                  }}
                >
                  <Text style={styles.primaryBtnText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    onClose();
                    router.push('/auth/login');
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.ghostBtn} onPress={onClose}>
                  <Text style={styles.ghostBtnText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
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
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  buttons: {
    gap: SPACING.sm,
  },
  primaryBtn: {
    backgroundColor: COLORS.accentGold,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 16,
    color: '#000',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  ghostBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
