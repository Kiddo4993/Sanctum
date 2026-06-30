import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { listenToMessages, sendMessage } from '../services/MessagingService';
import { supabase } from '../services/SupabaseClient';
import { COLORS, FONTS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ chatId: propChatId }) {
  const chatId = propChatId || 'global-test-chat';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mountedRef.current && data?.session?.user?.id) {
        setUserId(data.session.user.id);
      }
    }).catch(console.warn);

    const unsubscribe = listenToMessages(chatId, (newMessages) => {
      if (mountedRef.current) setMessages(newMessages);
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [chatId]);

  const handleSend = async () => {
    if (input.trim() === '' || !userId) return;
    const text = input.trim();
    setInput('');
    try {
      await sendMessage(chatId, userId, text);
    } catch (e) {
      console.warn('[ChatScreen] send failed', e);
      Alert.alert('Error', 'Message could not be sent. Please try again.');
      setInput(text);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender_id === userId;
    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
        {item.verse_ref && (
          <View style={styles.verseQuote}>
            <Text style={styles.quoteRef}>{item.verse_ref.reference}</Text>
          </View>
        )}
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={24} color={COLORS.accentGold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  bubble: { padding: 12, borderRadius: 16, marginBottom: 12, maxWidth: '80%' },
  myBubble: { backgroundColor: 'rgba(255, 255, 255, 0.1)', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: 'rgba(201, 168, 76, 0.2)', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { color: COLORS.textPrimary, fontFamily: FONTS.sans, fontSize: 16 },
  verseQuote: { borderLeftWidth: 2, borderColor: COLORS.accentGold, paddingLeft: 8, marginBottom: 4 },
  quoteRef: { color: COLORS.accentGold, fontFamily: FONTS.serif, fontStyle: 'italic' },
  inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderColor: '#333' },
  textInput: { flex: 1, color: '#FFF', backgroundColor: '#1C1C1E', borderRadius: 20, paddingHorizontal: 16, height: 42 },
  sendButton: { justifyContent: 'center', marginLeft: 12 }
});
