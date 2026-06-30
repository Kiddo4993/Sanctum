# Sanctum V2 — Updates & Unfinished Features

All items that need to be completed before Version 2 ships.

---

## ✅ Completed

| # | Item |
|---|------|
| 1 | **Wire V2 Screens** — App.js imports and renders AuthScreen, FriendsScreen, ProfileScreen |
| 2 | **Global Auth State** — `supabase.auth.onAuthStateChange` in App.js; session drives all routing |
| 3 | **PaywallScreen** — Bottom-sheet modal with trial CTA; 20 scroll free limit; feature-gate for friends/profile tabs |
| 4 | **Friends Tab** — FriendsScreen with bidirectional friends list, sub-nav to My QR / Scan / Chat |
| 5 | **Chat chatId** — ChatScreen receives `chatId` derived from sorted user ID pair in FriendsScreen |
| 6 | **ScrollPrompt Sign-Up Button** — Now accepts `onSignUp` callback; button text updated to "Create Account" |
| 7 | **UsernameSetupScreen** — Shown after first OAuth login if `profiles.username` is null; validates `/^[a-zA-Z0-9_]{3,30}$/` |
| 8 | **Duplicate/Self-Friend Guard** — Both App.js and ScannerScreen check `myUserId !== friendProfile.id` and surface insert errors |
| 9 | **Unlike Bug** — `toggleLike` now calls `.delete()` instead of `.update({is_liked:false})` |
| 11 | **Deep-Link Username Sanitized** — `USERNAME_RE` + query-param/hash stripping in App.js AND ScannerScreen |
| 12 | **ChatScreen Send Errors** — `handleSend` awaits `sendMessage`, shows alert on failure, restores input |
| 13 | **ChatScreen userId Race** — `userId` initializes to `null`; `mountedRef` guards async updates |
| 15 | **@expo/vector-icons in package.json** — Added as explicit dependency |
| 16 | **ErrorBoundary** — `ErrorBoundary.js` wraps all three app states (auth, username setup, main app) |
| 17 | **Firebase Config Validation** — `FirebaseClient.js` logs a clear warning when env vars are missing |
| 18 | **Dwell Timer Cleanup** — `ScrollFeed` unmount `useEffect` clears all pending `setTimeout`s |
| 19 | **Supabase Error Handling on Friend Insert** — `{ error }` destructured; success alert only fires on success |
| 20 | **Algorithm Sync Debouncing** — `recordInteraction` gates Supabase writes to at most once per 30 seconds |
| 21 | **UNIQUE Constraints** — `friends(user_id, friend_id)` and `saved_quotes(user_id, verse_id)` unique constraints in schema.sql |
| 22 | **`profiles.is_premium` Column** — Added to schema.sql with RLS policy preventing user self-escalation |
| 23 | **Bidirectional Friends** — FriendsScreen unions both directions (user_id = me OR friend_id = me) |

---

## 🔴 Still Needed Before Launch

### RevenueCat / IAP Integration
- `PaywallScreen.onSubscribe` currently shows "Coming Soon" alert
- Need to install `react-native-purchases`, configure product IDs, and handle purchase callbacks
- On purchase: set `profiles.is_premium = true` via a Supabase Edge Function (service role only) to avoid client-side self-escalation

### Verse Pool Expansion
- Only 20 total verses (5 per genre × 4 genres) — repeats begin immediately after the first session
- Options: hardcode 100+ verses per genre, or integrate a Bible API (e.g. ESV API, bible-api.com)
- Long-term: server-side verse selection based on user weights

### iOS Widget Bundle ID
- `group.com.yourname.biblescroller` placeholder in LikeService.js
- Replace with real app group matching `ios.bundleIdentifier` in app.json

### Firestore Security Rules
- Firestore currently has no auth layer (app uses Supabase, not Firebase Auth)
- `sender_id` on messages is fully client-controlled — any user can impersonate another
- Fix: implement a Supabase → Firebase Auth token exchange, or move chat to Supabase Realtime
- Until then, treat all Firestore data as unauthenticated

### OAuth Deep-Link Scheme (Android hardening)
- `AuthScreen` uses `biblescroller://login-callback` (custom scheme)
- On Android, any app can register the same scheme and intercept OAuth redirects
- Upgrade to Universal Links (iOS) / App Links (Android) using `https://` with verified domain

---

## 🟢 Nice to Have

- **LikeService init race** — `ensureLikedInit` / `ensureSavedInit` don't memoize the in-flight promise; concurrent callers each start a parallel AsyncStorage read. Store the init promise as a module variable.
- **React Navigation** — Current manual tab routing limits stack-based sub-navigation; consider adding `@react-navigation/native` for proper screen stacks within each tab.
- **Username immutability** — UsernameSetupScreen warns "you can't change it later" but there's no DB-level enforcement. Add a trigger or remove the upsert option for `username` in the RLS update policy.
