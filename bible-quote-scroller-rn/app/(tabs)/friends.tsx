// ============================================================
// Friends Screen — Friend list and Add Friend section (via QR/username)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  searchByUsername,
  acceptFriendRequest,
} from '../../src/services/FriendService';
import { getCurrentProfile } from '../../src/services/AuthService';
import { createGroupChat } from '../../src/services/MessagingService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme';
import type { Friendship, Profile } from '../../src/types';
import ProfileView from '../../src/components/ProfileView';

export default function FriendsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'friends' | 'profile'>('friends');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<(Friendship & { friend: Profile })[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function init() {
      const profile = await getCurrentProfile();
      setCurrentUser(profile);
      if (profile) await loadData(profile.id);
      setLoading(false);
    }
    init();
  }, []);

  const loadData = async (userId: string) => {
    const [fList, reqList] = await Promise.all([
      getFriends(userId),
      getPendingRequests(userId),
    ]);
    setFriends(fList);
    setRequests(reqList);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchByUsername(searchQuery);
    // Filter out self and existing friends
    const filtered = results.filter(
      (r) =>
        r.id !== currentUser?.id &&
        !friends.some((f) => f.friend.id === r.id)
    );
    setSearchResults(filtered);
    setSearching(false);
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!currentUser) return;
    try {
      await sendFriendRequest(currentUser.id, receiverId, 'username');
      Alert.alert('Sent', 'Friend request sent!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!currentUser) return;
    try {
      await acceptFriendRequest(requestId);
      await loadData(currentUser.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleMessageUser = async (friendId: string, friendName: string) => {
    if (!currentUser) return;
    try {
      // DMs map to group chats with 2 members for simplicity here (or use sendDirectMessage)
      const chatId = await createGroupChat(
        `DM with ${friendName}`,
        [currentUser.id, friendId],
        currentUser.id
      );
      router.push(`/chat/${chatId}`);
    } catch (e: any) {
      Alert.alert('Error', 'Could not open chat.');
    }
  };

  if (!currentUser) {
    return (
      <View style={styles.center}>
        <Text style={styles.header}>Friends</Text>
        <Text style={styles.emptyBody}>Sign in to connect with friends.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.btnText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accentPlatinum} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Segmented Controls */}
      <View style={styles.topTabs}>
        <TouchableOpacity 
          style={[styles.topTab, activeTab === 'friends' && styles.activeTab]} 
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.topTabText, activeTab === 'friends' && styles.activeTabText]}>FRIENDS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.topTab, activeTab === 'profile' && styles.activeTab]} 
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.topTabText, activeTab === 'profile' && styles.activeTabText]}>PROFILE</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'profile' ? (
        <ProfileView />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Add Friend Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Friend</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.input}
                placeholder="Search username"
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Text style={styles.btnText}>Search</Text>
              </TouchableOpacity>
            </View>

            {searching && <ActivityIndicator color={COLORS.accentPlatinum} style={{ marginTop: SPACING.md }} />}
            
            {searchResults.map((p) => (
              <View key={p.id} style={styles.userRow}>
                <Text style={styles.userName}>{p.display_name} (@{p.username})</Text>
                <TouchableOpacity style={styles.smallBtn} onPress={() => handleSendRequest(p.id)}>
                  <Text style={styles.smallBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Pending Requests */}
          {requests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requests</Text>
              {requests.map((req) => (
                <View key={req.id} style={styles.userRow}>
                  <Text style={styles.userName}>{req.requester?.display_name}</Text>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => handleAcceptRequest(req.id)}>
                    <Text style={styles.smallBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Friend List */}
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Your Friends</Text>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.userRow}>
                  <Text style={styles.userName}>{item.friend?.display_name}</Text>
                  <TouchableOpacity
                    style={styles.smallBtnOutline}
                    onPress={() => handleMessageUser(item.friend.id, item.friend.display_name)}
                  >
                    <Text style={styles.smallBtnOutlineText}>Message</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>You haven't added any friends yet.</Text>
              }
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
  },
  topTab: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.accentPlatinum,
  },
  topTabText: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  activeTabText: {
    color: COLORS.textPrimary,
  },
  header: { fontFamily: FONTS.serif, fontSize: 28, color: COLORS.textPrimary, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  sectionTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.md },
  searchRow: { flexDirection: 'row', gap: SPACING.sm },
  input: { flex: 1, height: 48, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, color: COLORS.textPrimary, fontFamily: FONTS.sans, borderWidth: 1, borderColor: COLORS.borderLight },
  searchBtn: { backgroundColor: COLORS.accentPlatinum, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.md, justifyContent: 'center' },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.borderLight },
  userName: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.textPrimary },
  primaryBtn: { backgroundColor: COLORS.accentPlatinum, paddingVertical: 14, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.md, marginTop: SPACING.lg },
  btnText: { fontFamily: FONTS.sansBold, fontSize: 16, color: '#000' },
  smallBtn: { backgroundColor: COLORS.accentPlatinum, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.sm },
  smallBtnText: { fontFamily: FONTS.sansBold, fontSize: 12, color: '#000' },
  smallBtnOutline: { backgroundColor: 'transparent', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  smallBtnOutlineText: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.textPrimary },
  emptyBody: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
  emptyText: { fontFamily: FONTS.sans, fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic' },
});
