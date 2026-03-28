import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../theme";

const OPTIONS = [
  { id: "closer", label: "Get closer with God" },
  { id: "bible", label: "Interested in the Bible" },
  { id: "phrases", label: "Want to discover more phrases" },
  { id: "other", label: "Other" },
];

export default function OnboardingScreen({ onContinue }) {
  const [selected, setSelected] = useState({});
  const [otherText, setOtherText] = useState("");

  const toggle = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isOtherSelected = selected["other"];
  const canContinue =
    Object.values(selected).some(Boolean) &&
    (!isOtherSelected || otherText.trim().length > 0);

  const handleContinue = () => {
    const reasons = OPTIONS.filter((o) => selected[o.id]).map((o) =>
      o.id === "other" ? `Other: ${otherText.trim()}` : o.label
    );
    onContinue(reasons);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.question}>What made you download this app?</Text>
          <Text style={styles.subtext}>Select all that apply</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const isChecked = !!selected[option.id];
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, isChecked && styles.optionSelected]}
                onPress={() => toggle(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
                  {isChecked && (
                    <Ionicons name="checkmark" size={14} color={COLORS.background} />
                  )}
                </View>
                <Text style={[styles.optionLabel, isChecked && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* "Other" text expansion */}
          {isOtherSelected && (
            <TextInput
              style={styles.otherInput}
              placeholder="Tell us more…"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={otherText}
              onChangeText={setOtherText}
              multiline
              selectionColor={COLORS.accentGold}
              autoFocus
            />
          )}
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 32,
  },
  header: {
    marginBottom: 28,
  },
  question: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 28,
  },
  subtext: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  options: {
    gap: 12,
    marginBottom: 32,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  optionSelected: {
    borderColor: COLORS.accentGold,
    backgroundColor: "rgba(201,168,76,0.07)",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: COLORS.accentGold,
    borderColor: COLORS.accentGold,
  },
  optionLabel: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    flex: 1,
  },
  optionLabelSelected: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansBold,
  },
  otherInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: 14,
    color: COLORS.textPrimary,
    fontFamily: FONTS.sans,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  btn: {
    backgroundColor: COLORS.accentGold,
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: COLORS.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  btnText: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});
