import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    mountedRef.current = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mountedRef.current && data?.session?.user?.id) {
        setUserId(data.session.user.id);
      }
    }).catch(console.warn);

    const unsubscribe = listenToMessages(chatId, (newMessages) => {
      if (mountedRef.current) {
        setMessages(newMessages);
        // Scroll to bottom on new message
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor="#666"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={22} color={input.trim() ? COLORS.accentGold : '#444'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 8 },
  bubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myBubble: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: 'rgba(201,168,76,0.18)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  verseQuote: {
    borderLeftWidth: 2,
    borderColor: COLORS.accentGold,
    paddingLeft: 8,
    marginBottom: 4,
  },
  quoteRef: {
    color: COLORS.accentGold,
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: COLORS.background,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    backgroundColor: '#1C1C1E',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    fontFamily: FONTS.sans,
    minHeight: 40,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
