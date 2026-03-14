// ============================================================
// Group Chat / DM Screen
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  getGroupChat,
  subscribeToChat,
  sendMessage,
} from '../../src/services/MessagingService';
import { getCurrentProfile } from '../../src/services/AuthService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme';
import type { Message, Profile, GroupChat } from '../../src/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [chatInfo, setChatInfo] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const p = await getCurrentProfile();
      setCurrentUser(p);
      if (id) {
        const info = await getGroupChat(id);
        setChatInfo(info);
      }
    }
    init();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToChat(id, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser || !id) return;
    const text = inputText.trim();
    setInputText('');
    try {
      await sendMessage(id, currentUser.id, currentUser.display_name, text);
    } catch {
      // Message failed, offline persistence will retry later
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUser?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        {!isMe && <Text style={styles.senderName}>{item.sender_name}</Text>}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {item.quote_text && (
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>"{item.quote_text}"</Text>
            </View>
          )}
          <Text style={styles.msgText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  if (!currentUser) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: chatInfo?.name || 'Chat',
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontFamily: FONTS.sansBold },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: SPACING.md }}>
              <Text style={{ color: COLORS.accentGold, fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accentGold} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          inverted
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: SPACING.lg },
  msgRow: { marginBottom: SPACING.md, maxWidth: '80%' },
  msgRowMe: { alignSelf: 'flex-end' },
  msgRowThem: { alignSelf: 'flex-start' },
  senderName: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.textMuted, marginBottom: 4, marginLeft: 4 },
  bubble: { paddingHorizontal: SPACING.md, paddingVertical: 12, borderRadius: RADIUS.lg },
  bubbleMe: { backgroundColor: COLORS.accentGold, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.borderLight },
  msgText: { fontFamily: FONTS.sans, fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  quoteCard: { backgroundColor: 'rgba(0,0,0,0.2)', padding: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.5)' },
  quoteText: { fontFamily: FONTS.serifItalic, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  inputBar: { flexDirection: 'row', padding: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.md, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.borderLight, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: SPACING.md, paddingTop: 12, paddingBottom: 12, color: COLORS.textPrimary, fontFamily: FONTS.sans, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: COLORS.accentGold, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.sm, marginBottom: 2 },
  sendIcon: { fontSize: 20, color: '#000', fontWeight: 'bold' },
});
