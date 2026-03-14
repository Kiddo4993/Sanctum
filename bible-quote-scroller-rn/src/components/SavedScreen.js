import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getSavedVerses, toggleSave } from "../services/LikeService";
import { COLORS, FONTS } from "../theme";

export default function SavedScreen() {
  const [saved, setSaved] = useState([]);

  const load = useCallback(async () => {
    const savesMap = await getSavedVerses();
    const sorted = Object.values(savesMap).sort((a, b) => b.savedAt - a.savedAt);
    setSaved(sorted);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (verse) => {
    await toggleSave(verse);
    load(); // refresh list
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardText}>
        <Text style={styles.reference}>{item.reference}</Text>
        <Text style={styles.preview} numberOfLines={3}>
          {item.content.replace(/<[^>]+>/g, "")}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleRemove(item)} activeOpacity={0.7}>
        <Ionicons name="bookmark" size={22} color={COLORS.accentGold} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Saved Verses</Text>
      {saved.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={48} color="rgba(255,255,255,0.15)" />
          <Text style={styles.emptyText}>No saved verses yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the bookmark icon on any verse to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heading: {
    fontFamily: FONTS.sansBold,
    color: COLORS.textPrimary,
    fontSize: 22,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.sheetBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardText: {
    flex: 1,
  },
  reference: {
    fontFamily: FONTS.sansBold,
    color: COLORS.accentGold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  preview: {
    fontFamily: FONTS.serif,
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.85,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 80,
  },
  emptyText: {
    fontFamily: FONTS.sansBold,
    color: "rgba(255,255,255,0.4)",
    fontSize: 17,
  },
  emptySubtext: {
    fontFamily: FONTS.sans,
    color: "rgba(255,255,255,0.25)",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
