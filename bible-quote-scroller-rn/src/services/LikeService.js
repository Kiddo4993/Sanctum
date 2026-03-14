import AsyncStorage from '@react-native-async-storage/async-storage';

const LIKES_KEY = '@sanctum_liked_verses';

export const getLikedVerses = async () => {
    try {
        const json = await AsyncStorage.getItem(LIKES_KEY);
        return json ? JSON.parse(json) : {};
    } catch {
        return {};
    }
};

export const isLiked = async (verseId) => {
    const likes = await getLikedVerses();
    return !!likes[verseId];
};

export const toggleLike = async (verse) => {
    const likes = await getLikedVerses();
    if (likes[verse.id]) {
        delete likes[verse.id];
    } else {
        likes[verse.id] = {
            id: verse.id,
            reference: verse.reference,
            content: verse.content,
            likedAt: Date.now(),
        };
    }
    await AsyncStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    return !!likes[verse.id]; // returns new liked state
};
