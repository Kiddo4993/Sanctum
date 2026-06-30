import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY || !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
  console.warn(
    '[FirebaseClient] Missing Firebase config — chat features will not work.\n' +
    'Set EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID in your .env file.'
  );
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  // Depending on what features you use, you may also need authDomain, storageBucket, messagingSenderId, appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
