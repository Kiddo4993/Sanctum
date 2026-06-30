import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';

const FEATURES = [
  { icon: 'infinite-outline', label: 'Unlimited daily scrolling' },
  { icon: 'cloud-upload-outline', label: 'Cross-device algorithm sync' },
  { icon: 'people-outline', label: 'Friends & group chats' },
  { icon: 'qr-code-outline', label: 'QR friend-add & profile' },
  { icon: 'phone-portrait-outline', label: 'Home screen widget' },
];

export default function PaywallScreen({ visible, onClose, onSubscribe, reason }) {
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
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <View style={styles.badge}>
                <Ionicons name="star" size={18} color="#000" />
                <Text style={styles.badgeText}>Sanctum Premium</Text>
              </View>

              <Text style={styles.title}>
                {reason === 'scroll_limit'
                  ? "You've reached today's limit"
                  : 'Unlock everything'}
              </Text>
              <Text style={styles.subtitle}>
                {reason === 'scroll_limit'
                  ? 'Free accounts get 20 verses per day. Upgrade for unlimited access and all premium features.'
                  : 'One subscription unlocks all the features that make Sanctum yours.'}
              </Text>

              <View style={styles.featureList}>
                {FEATURES.map((f) => (
                  <View key={f.label} style={styles.featureRow}>
                    <Ionicons
                      name={f.icon}
                      size={20}
                      color={COLORS.accentGold}
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={onSubscribe}>
                <Text style={styles.primaryBtnText}>Start 7-day free trial</Text>
              </TouchableOpacity>
              <Text style={styles.priceNote}>
                Then $2.99 / month · Cancel anytime
              </Text>

              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                <Text style={styles.secondaryBtnText}>Maybe later</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.sheetBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    padding: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentGold,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 18,
    gap: 6,
  },
  badgeText: {
    fontFamily: FONTS.sansBold,
    fontSize: 13,
    color: '#000',
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 26,
    color: COLORS.textPrimary,
    marginBottom: 10,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  featureList: {
    marginBottom: 28,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 12,
    width: 24,
  },
  featureLabel: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  primaryBtn: {
    backgroundColor: COLORS.accentGold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBtnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 16,
    color: '#000',
  },
  priceNote: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
