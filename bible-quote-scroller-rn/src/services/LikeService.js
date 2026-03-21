import AsyncStorage from '@react-native-async-storage/async-storage';

const LIKES_KEY = '@sanctum_liked_verses';
const SAVES_KEY = '@sanctum_saved_verses';

// ── Generic helpers ──────────────────────────────────────────────────────────

const getMap = async (key) => {
    try {
        const json = await AsyncStorage.getItem(key);
        return json ? JSON.parse(json) : {};
    } catch {
        return {};
    }
};

const toggle = async (key, verse) => {
    const map = await getMap(key);
    if (map[verse.id]) {
        delete map[verse.id];
    } else {
        map[verse.id] = {
            id: verse.id,
            reference: verse.reference,
            content: verse.content,
            savedAt: Date.now(),
        };
    }
    await AsyncStorage.setItem(key, JSON.stringify(map));
    return !!map[verse.id];
};

// ── Likes (heart) ────────────────────────────────────────────────────────────

export const getLikedVerses = () => getMap(LIKES_KEY);

export const isLiked = async (verseId) => {
    const map = await getMap(LIKES_KEY);
    return !!map[verseId];
};

export const toggleLike = (verse) => toggle(LIKES_KEY, verse);

// ── Saves (bookmark) ─────────────────────────────────────────────────────────

export const getSavedVerses = () => getMap(SAVES_KEY);

export const isSaved = async (verseId) => {
    const map = await getMap(SAVES_KEY);
    return !!map[verseId];
};

export const toggleSave = (verse) => toggle(SAVES_KEY, verse);
