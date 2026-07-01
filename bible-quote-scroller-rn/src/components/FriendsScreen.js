import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/SupabaseClient';
import { COLORS, FONTS } from '../theme';
import ProfileScreen from './ProfileScreen';
import ScannerScreen from './ScannerScreen';
import ChatScreen from './ChatScreen';

// view: 'list' | 'qr' | 'scanner' | 'chat'
export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState('list');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeFriendUsername, setActiveFriendUsername] = useState(null);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData?.session?.user?.id;
    if (!uid) { setLoading(false); return; }
    setMyUserId(uid);

    // Bidirectional: rows where I added someone + rows where someone added me
    const [{ data: asUser }, { data: asFriend }] = await Promise.all([
      supabase.from('friends').select('friend_id').eq('user_id', uid),
      supabase.from('friends').select('user_id').eq('friend_id', uid),
    ]);

    const friendIds = [
      ...((asUser || []).map(r => r.friend_id)),
      ...((asFriend || []).map(r => r.user_id)),
    ];
    const uniqueIds = [...new Set(friendIds)];

    if (uniqueIds.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', uniqueIds);

    setFriends(profiles || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  function openChat(friend) {
    const chatId = [myUserId, friend.id].sort().join('_');
    setActiveChatId(chatId);
    setActiveFriendUsername(friend.username || friend.display_name || 'Friend');
    setView('chat');
  }

  const backRowStyle = [styles.backRow, { paddingTop: insets.top + 8 }];
  const headerStyle = [styles.header, { paddingTop: insets.top + 8 }];

  if (view === 'qr') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={backRowStyle} onPress={() => setView('list')}>
          <Ionicons name="arrow-back" size={22} color={COLORS.accentGold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <ProfileScreen />
      </View>
    );
  }

  if (view === 'scanner') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={backRowStyle} onPress={() => setView('list')}>
          <Ionicons name="arrow-back" size={22} color={COLORS.accentGold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <ScannerScreen />
      </View>
    );
  }

  if (view === 'chat') {
    return (
      <View style={styles.flex}>
        <View style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.chatBackBtn} onPress={() => setView('list')}>
            <Ionicons name="arrow-back" size={22} color={COLORS.accentGold} />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>@{activeFriendUsername}</Text>
        </View>
        <ChatScreen chatId={activeChatId} />
      </View>
    );
  }

  // 'list' view
  return (
    <View style={styles.container}>
      <View style={headerStyle}>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setView('qr')}>
            <Ionicons name="qr-code-outline" size={22} color={COLORS.accentGold} />
            <Text style={styles.headerBtnText}>My QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setView('scanner')}>
            <Ionicons name="scan-outline" size={22} color={COLORS.accentGold} />
            <Text style={styles.headerBtnText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accentGold} style={styles.loader} />
      ) : friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#444" />
          <Text style={styles.emptyTitle}>No friends yet</Text>
          <Text style={styles.emptySubtext}>Tap "Scan" to add a friend using their QR code.</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const displayName = item.username || item.display_name || 'Unknown';
            const initial = displayName[0].toUpperCase();
            return (
              <TouchableOpacity style={styles.friendRow} onPress={() => openChat(item)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <Text style={styles.friendName}>@{displayName}</Text>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.accentGold} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: COLORS.textPrimary,
  },
  headerButtons: { flexDirection: 'row', gap: 16 },
  headerBtn: { alignItems: 'center', gap: 4 },
  headerBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.accentGold,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  backText: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: COLORS.accentGold,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  chatBackBtn: {
    padding: 4,
  },
  chatHeaderTitle: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  list: { padding: 16 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(201,168,76,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.accentGold,
  },
  friendName: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  loader: { marginTop: 48 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    color: '#888',
  },
  emptySubtext: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
});
