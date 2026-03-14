// ============================================================
// MessagingService — Firebase Firestore group chats & DMs
//
// Uses Firestore's real-time listeners for instant message delivery.
// Offline persistence is enabled in firebaseConfig.ts so messages
// are available even without connectivity.
// ============================================================

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { GroupChat, Message } from '../types';

// ── Group Chats ─────────────────────────────────────────────

/**
 * Create a new group chat.
 */
export async function createGroupChat(
  name: string,
  memberIds: string[],
  createdBy: string
): Promise<string> {
  const chatRef = await addDoc(collection(db, 'group_chats'), {
    name,
    members: memberIds,
    created_by: createdBy,
    created_at: serverTimestamp(),
    last_message: '',
  });

  return chatRef.id;
}

/**
 * Get a single group chat by ID.
 */
export async function getGroupChat(chatId: string): Promise<GroupChat | null> {
  const snap = await getDoc(doc(db, 'group_chats', chatId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as GroupChat;
}

/**
 * Get all group chats the user belongs to.
 */
export async function getUserChats(userId: string): Promise<GroupChat[]> {
  // Firestore doesn't support array-contains with other compound queries well,
  // so we query all chats containing the user.
  const q = query(collection(db, 'group_chats'));
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as GroupChat)
    .filter((chat) => chat.members.includes(userId));
}

/**
 * Send a message to a group chat.
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  text: string,
  quoteRef?: { quoteId: string; quoteText: string }
): Promise<void> {
  const messagesRef = collection(db, 'group_chats', chatId, 'messages');

  await addDoc(messagesRef, {
    sender_id: senderId,
    sender_name: senderName,
    text,
    ...(quoteRef && {
      quote_id: quoteRef.quoteId,
      quote_text: quoteRef.quoteText,
    }),
    sent_at: serverTimestamp(),
  });

  // Update last_message on the chat document
  await updateDoc(doc(db, 'group_chats', chatId), {
    last_message: text,
  });
}

/**
 * Subscribe to real-time messages in a chat.
 * Returns an unsubscribe function.
 */
export function subscribeToChat(
  chatId: string,
  callback: (messages: Message[]) => void,
  messageLimit: number = 50
): Unsubscribe {
  const q = query(
    collection(db, 'group_chats', chatId, 'messages'),
    orderBy('sent_at', 'desc'),
    limit(messageLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
        sent_at: d.data().sent_at?.toDate() ?? new Date(),
      }))
      .reverse() as Message[];

    callback(messages);
  });
}

// ── Direct Messages ─────────────────────────────────────────

/**
 * Generate a deterministic DM channel ID from two user IDs.
 */
function getDmChannelId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

/**
 * Send a direct message. Creates the DM channel if it doesn't exist.
 */
export async function sendDirectMessage(
  senderId: string,
  senderName: string,
  receiverId: string,
  text: string,
  quoteRef?: { quoteId: string; quoteText: string }
): Promise<void> {
  const channelId = getDmChannelId(senderId, receiverId);
  const channelRef = doc(db, 'direct_messages', channelId);

  // Ensure channel document exists
  const channelSnap = await getDoc(channelRef);
  if (!channelSnap.exists()) {
    await setDoc(channelRef, {
      members: [senderId, receiverId],
      created_at: serverTimestamp(),
      last_message: '',
    });
  }

  const messagesRef = collection(db, 'direct_messages', channelId, 'messages');

  await addDoc(messagesRef, {
    sender_id: senderId,
    sender_name: senderName,
    text,
    ...(quoteRef && {
      quote_id: quoteRef.quoteId,
      quote_text: quoteRef.quoteText,
    }),
    sent_at: serverTimestamp(),
  });

  await updateDoc(channelRef, { last_message: text });
}

/**
 * Subscribe to real-time direct messages between two users.
 */
export function subscribeToDm(
  userId1: string,
  userId2: string,
  callback: (messages: Message[]) => void,
  messageLimit: number = 50
): Unsubscribe {
  const channelId = getDmChannelId(userId1, userId2);

  const q = query(
    collection(db, 'direct_messages', channelId, 'messages'),
    orderBy('sent_at', 'desc'),
    limit(messageLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
        sent_at: d.data().sent_at?.toDate() ?? new Date(),
      }))
      .reverse() as Message[];

    callback(messages);
  });
}
