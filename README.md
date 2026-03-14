# ✝ Sanctum

> *The light shines in the darkness, and the darkness has not overcome it.*

A minimal, contemplative Bible quote scroller for iOS and Android. Scroll through curated verses with AI-generated meanings, calming narration, and social features — all wrapped in a dark, focused interface where the Word is the only light.

---

## 🌟 Features

### Core Experience
- **Immersive Scroll Feed** — One verse at a time, full screen, with gentle fade transitions
- **AI-Generated Meanings** — Tap any verse to see a calm, thoughtful explanation powered by GPT-4o mini
- **Text-to-Speech Narration** — Multiple voice options via ElevenLabs, adjustable speed, pause/play controls
- **Guest Mode** — Start scrolling immediately, no login required

### Social & Personalization
- **Save & Like Verses** — Build your personal collection, powers your daily widget
- **Share with Friends** — Send verses directly in group chats or externally
- **Friend System** — Add friends by QR code scan or username search
- **Group Chats** — Discuss verses in real-time with friends (powered by Firebase Firestore)
- **Smart Algorithm** — Feed learns your taste based on likes and scrolling behavior

### Wellness
- **Eye Rest Prompt** — Gentle reminder after 1 hour of continuous use
- **Apple Home Widget** — Your favorite verse rotates daily on your home screen
- **Dark-First Design** — White text on deep charcoal — the verse glows like candlelight

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Expo (React Native) | Cross-platform iOS/Android from one codebase |
| **Database** | Supabase (PostgreSQL) | User accounts, likes, saves, friendships, QR codes |
| **Messaging** | Firebase Firestore | Real-time group chats |
| **Bible Data** | scripture.api.bible | Verse text, book/chapter/verse structure |
| **AI Meanings** | OpenAI GPT-4o mini | Generate verse explanations (~$0.01/1K requests) |
| **Narration** | ElevenLabs | Text-to-speech with natural voices (10K chars/mo free) |
| **Email** | Mailchimp API | Auto-subscribe users on sign up |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier)
- Firebase project (free tier)
- API keys for: OpenAI, ElevenLabs, scripture.api.bible, Mailchimp

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/sanctum.git
cd sanctum

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env (see Configuration below)

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

### Configuration

Create a `.env` file at the project root:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend API keys (use Supabase Edge Functions to keep these private)
ELEVENLABS_API_KEY=your_key
OPENAI_API_KEY=your_key
MAILCHIMP_API_KEY=your_key
BIBLE_API_KEY=your_key

# Firebase
FIREBASE_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_id
FIREBASE_APP_ID=your_app_id
```

⚠️ **Security Note**: Keys prefixed with `EXPO_PUBLIC_` are visible in client code. All other keys should be called from backend functions (Supabase Edge Functions or serverless API).

---

## 🗄 Database Schema

### Supabase Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  narrator_voice TEXT DEFAULT 'Rachel',
  theme TEXT DEFAULT 'dark',
  qr_code_token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMP DEFAULT now()
);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bible_api_id TEXT UNIQUE NOT NULL,
  book TEXT NOT NULL,
  testament TEXT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  text TEXT NOT NULL,
  category TEXT,
  like_count INT DEFAULT 0
);

-- Likes
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, quote_id)
);

-- Saves
CREATE TABLE saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, quote_id)
);

-- Friendships
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  method TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Quote Meanings
CREATE TABLE quote_meanings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  meaning_text TEXT NOT NULL,
  suggested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

### Firebase Firestore Collections

```
group_chats/
  {chatId}/
    name: string
    members: string[]
    created_by: string
    created_at: timestamp
    last_message: string
    
    messages/
      {messageId}/
        sender_id: string
        sender_name: string
        text: string
        quote_id: string (optional)
        quote_text: string (optional)
        sent_at: timestamp
```

---

## 📱 User Journey

1. **Open App** → Drop straight into guest mode quote scroller
2. **Scroll 10 times** → Gentle login nudge appears (dismissible)
3. **Sign Up** → Email/password or OAuth (Google, Facebook)
4. **Logged In** → Like, save, share verses; add friends via QR or username
5. **Tap Meaning** → AI explains the verse in 3-4 calm sentences
6. **1 Hour In** → Eye rest reminder toast appears
7. **Save Quotes** → Powers your daily rotating home screen widget

---

## 🎨 Design Philosophy

**White as light. Dark as the void.**

The app is built around a single metaphor: the verse text is pure white, glowing softly against near-black darkness. No bright colors, no distractions — just the Word illuminating the screen like a candle in a quiet room.

Typography: Serif fonts (EB Garamond, Cormorant) for verses, clean sans-serif (Inter) for UI.

---

## 🔮 Roadmap

### Phase 1 — Core (Weeks 1-3)
- [x] Expo project setup
- [ ] Supabase auth (email + OAuth)
- [ ] Bible API integration
- [ ] Quote scroller with narrator
- [ ] Guest mode with login nudge

### Phase 2 — Social (Weeks 4-6)
- [ ] Likes & saves
- [ ] Friend system (QR + username)
- [ ] Firebase group chats
- [ ] Share verses

### Phase 3 — Intelligence (Weeks 7-9)
- [ ] OpenAI meaning generation
- [ ] User-suggested meanings
- [ ] Smart feed algorithm
- [ ] Multiple narrator voices

### Phase 4 — Polish (Weeks 10-12)
- [ ] Apple home screen widget
- [ ] Mailchimp email integration
- [ ] Eye rest timer
- [ ] App Store submission

---

## 🤝 Contributing

This is a personal spiritual project, but thoughtful contributions are welcome. Please open an issue before submitting a PR to discuss your ideas.

---

## 🙏 Credits

- **Bible Text**: [scripture.api.bible](https://scripture.api.bible)
- **AI Meanings**: OpenAI GPT-4o mini
- **Narration**: ElevenLabs
- **Design Inspiration**: The quiet beauty of candlelit scripture reading

---

## 💬 Contact

Questions, feedback, or just want to share how the app has impacted you?

- Open an issue on GitHub
- Email: [your-email@example.com]
- Twitter: [@yourusername]

---

<p align="center">
  <em>"Be still, and know that I am God." — Psalm 46:10</em>
</p>
