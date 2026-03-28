import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../theme";

export default function ProfileScreen({ user, onSignOut }) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <SafeAreaView style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarArea}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "Anonymous"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Liked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.15)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuText}>Privacy</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.15)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Ionicons name="help-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuText}>Help</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.15)" />
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={18} color="#ff4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  avatarArea: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: COLORS.accentGold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  initials: {
    fontFamily: FONTS.cinzel,
    fontSize: 26,
    color: COLORS.accentGold,
  },
  name: {
    fontFamily: FONTS.sansBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.sheetBackground,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: FONTS.sansBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  menu: {
    backgroundColor: COLORS.sheetBackground,
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  menuText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,68,68,0.25)",
  },
  signOutText: {
    fontFamily: FONTS.sansBold,
    fontSize: 14,
    color: "#ff4444",
  },
});
