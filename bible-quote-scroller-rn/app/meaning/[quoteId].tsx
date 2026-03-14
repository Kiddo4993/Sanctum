// ============================================================
// Meaning View Screen — Full-screen AI meaning + verse
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getMeaning } from '../../src/services/MeaningService';
import { supabase } from '../../src/config/supabaseClient';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme';

export default function MeaningScreen() {
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>();
  const router = useRouter();
  
  const [verseText, setVerseText] = useState('');
  const [reference, setReference] = useState('');
  const [meaning, setMeaning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!quoteId) return;
      
      // 1. Fetch verse from Supabase
      const { data: quote } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();
        
      if (!quote) {
        setMeaning('Verse not found.');
        setLoading(false);
        return;
      }
      
      const plainText = quote.text.replace(/<[^>]*>/g, '').trim();
      const ref = `${quote.book} ${quote.chapter}:${quote.verse}`;
      setVerseText(plainText);
      setReference(ref);
      
      // 2. Fetch meaning
      try {
        const result = await getMeaning(quoteId, plainText, ref);
        setMeaning(result);
      } catch {
        setMeaning('Failed to load meaning.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quoteId]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Reflection',
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontFamily: FONTS.sansBold },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: SPACING.md }}>
              <Text style={{ color: COLORS.accentGold, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          ),
        }}
      />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accentGold} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.verseText}>"{verseText}"</Text>
          <Text style={styles.reference}>{reference}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.meaningHeading}>Meaning</Text>
          <Text style={styles.meaningText}>{meaning}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.xl, paddingBottom: 100 },
  verseText: { fontFamily: FONTS.serifItalic, fontSize: 24, color: COLORS.textPrimary, lineHeight: 36, textAlign: 'center', marginBottom: SPACING.md },
  reference: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.accentGold, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: SPACING.xl },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACING.lg },
  meaningHeading: { fontFamily: FONTS.serif, fontSize: 20, color: COLORS.textPrimary, marginBottom: SPACING.md },
  meaningText: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.textSecondary, lineHeight: 28 },
});
