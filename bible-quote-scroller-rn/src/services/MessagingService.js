import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './FirebaseClient';

/**
 * Listen to messages in a specific group chat or DM
 * @param {string} chatId 
 * @param {function} callback function to receive messages array
 * @returns unsubscribe function
 */
export function listenToMessages(chatId, callback) {
  const q = query(
    collection(db, 'group_chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });

  return unsubscribe;
}

/**
 * Send a new message or shared verse
 */
export async function sendMessage(chatId, senderId, text, verseRef = null) {
  const messagesRef = collection(db, 'group_chats', chatId, 'messages');
  return addDoc(messagesRef, {
    sender_id: senderId,
    text: text,
    verse_ref: verseRef,
    timestamp: serverTimestamp()
  });
}
