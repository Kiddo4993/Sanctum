import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../theme";

export default function CreateAccountScreen({ onNavigateToSignIn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    // TODO: wire up magic link auth / user creation
    onAccountCreated({ name: name.trim(), email: email.trim() });
  };

  const isReady = name.trim().length > 0 && email.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
      {/* Branding */}
      <View style={styles.brandingArea}>
      <View style={styles.cross}>
        <View style={styles.crossVertical} />
        <View style={styles.crossHorizontal} />
      </View>
        <Text style={styles.appName}>SANCTUM</Text>
        <Text style={styles.tagline}>Begin your journey.</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="rgba(255,255,255,0.2)"
          autoCapitalize="words"
          autoCorrect={false}
          selectionColor={COLORS.accentGold}
        />

        <Text style={[styles.inputLabel, { marginTop: 28 }]}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="rgba(255,255,255,0.2)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={COLORS.accentGold}
        />
        <Text style={styles.helperText}>We'll send a link to your inbox</Text>

        <TouchableOpacity
          style={[styles.primaryButton, !isReady && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!isReady}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social */}
      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
          <Ionicons name="logo-apple" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
          <Ionicons name="logo-google" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={onNavigateToSignIn} activeOpacity={0.7}>
          <Text style={styles.footerLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 36,
    paddingVertical: 48,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  brandingArea: {
    alignItems: "center",
    marginBottom: 48,
  },
  cross: {
    width: 24,
    height: 36,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossVertical: {
    position: 'absolute',
    width: 2,
    height: 36,
    backgroundColor: COLORS.accentGold,
    borderRadius: 1,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: COLORS.accentGold,
    borderRadius: 1,
    top: 8,
  },
  appName: {
    fontFamily: FONTS.cinzel,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 6,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: FONTS.serifItalic,
    fontSize: 15,
    color: COLORS.accentGold,
    letterSpacing: 0.5,
  },
  form: {
    width: "100%",
    marginBottom: 32,
  },
  inputLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.accentGold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
  },
  helperText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    marginTop: 8,
    marginBottom: 32,
    fontStyle: "italic",
  },
  primaryButton: {
    backgroundColor: COLORS.accentGold,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    color: COLORS.background,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  dividerText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    marginHorizontal: 16,
  },
  socialRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 48,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
  },
  footerLink: {
    fontFamily: FONTS.sansBold,
    fontSize: 14,
    color: COLORS.accentGold,
  },
});
