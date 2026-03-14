// ============================================================
// FriendService — Friend requests, QR codes, username search
//
// Flow:
//   1. User scans QR code → resolves qr_code_token → sends friend request
//   2. User searches by username → sends friend request
//   3. Receiver accepts/blocks the request
// ============================================================

import { supabase } from '../config/supabaseClient';
import type { Friendship, Profile } from '../types';

/**
 * Send a friend request by user ID.
 */
export async function sendFriendRequest(
  requesterId: string,
  receiverId: string,
  method: 'qr_code' | 'username'
): Promise<Friendship> {
  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
    .single();

  if (existing) {
    throw new Error(
      existing.status === 'blocked'
        ? 'This user is blocked'
        : 'Friend request already exists'
    );
  }

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      requester_id: requesterId,
      receiver_id: receiverId,
      status: 'pending',
      method,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Friendship;
}

/**
 * Accept a pending friend request.
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);

  if (error) throw new Error(error.message);
}

/**
 * Block a user (updates existing friendship or creates one).
 */
export async function blockUser(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'blocked' })
    .eq('id', friendshipId);

  if (error) throw new Error(error.message);
}

/**
 * Remove a friendship entirely.
 */
export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) throw new Error(error.message);
}

/**
 * Get all accepted friends for a user.
 */
export async function getFriends(userId: string): Promise<(Friendship & { friend: Profile })[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)')
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) {
    console.warn('[FriendService] Failed to fetch friends:', error.message);
    return [];
  }

  // Normalize: always return the "other" user as `friend`
  return (data ?? []).map((f: any) => ({
    ...f,
    friend: f.requester_id === userId ? f.receiver : f.requester,
  }));
}

/**
 * Get pending friend requests sent to the current user.
 */
export async function getPendingRequests(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:profiles!requester_id(*)')
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.warn('[FriendService] Failed to fetch requests:', error.message);
    return [];
  }

  return (data ?? []) as Friendship[];
}

/**
 * Look up a user by their QR code token.
 * Returns the profile or null if not found.
 */
export async function findByQrToken(token: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('qr_code_token', token)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

/**
 * Search for users by username (partial match).
 */
export async function searchByUsername(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `%${query}%`)
    .limit(10);

  if (error) {
    console.warn('[FriendService] Search failed:', error.message);
    return [];
  }

  return (data ?? []) as Profile[];
}
