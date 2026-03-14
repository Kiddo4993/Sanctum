import { VERSE_POOL } from './bibleApi';

export const sessionState = {
    id: crypto.randomUUID(), // unique per tab/session
    weights: { wisdom: 1, gospels: 1, epistles: 1, prophecy: 1 },
    seen: new Set(), // verse IDs already shown this session
    scrollCount: 0,
};

export const recordInteraction = (genre) => {
    if (sessionState.weights[genre] !== undefined) {
        sessionState.weights[genre] += 1;
    }
};

const pickGenre = () => {
    if (Math.random() < 0.4) {
        const genres = Object.keys(VERSE_POOL);
        return genres[Math.floor(Math.random() * genres.length)];
    }
    const weights = sessionState.weights;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (const [genre, weight] of Object.entries(weights)) {
        rand -= weight;
        if (rand <= 0) return genre;
    }
    return 'gospels'; // fallback
};

export const getNextVerseId = () => {
    const genre = pickGenre();
    const pool = VERSE_POOL[genre].filter(id => !sessionState.seen.has(id));

    if (pool.length === 0) {
        sessionState.seen.clear(); // reset seen if all shown
    }

    // Re-filter the pool in case it was empty and we cleared the seen set
    const currentPool = VERSE_POOL[genre].filter(id => !sessionState.seen.has(id));
    const verseId = currentPool[Math.floor(Math.random() * currentPool.length)];

    sessionState.seen.add(verseId);
    sessionState.scrollCount++;

    return { verseId, genre };
};
