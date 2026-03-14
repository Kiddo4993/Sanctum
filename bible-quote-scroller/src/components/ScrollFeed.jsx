import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchVerse } from '../services/bibleApi';
import { getNextVerseId, sessionState } from '../services/algorithm';
import QuoteCard from './QuoteCard';
import ScrollPrompt from './ScrollPrompt';

export default function ScrollFeed() {
    const [cards, setCards] = useState([]);
    const [showLoginNudge, setShowLoginNudge] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);

    // Use a ref to track if we're currently fetching to avoid race conditions
    const fetchingRef = useRef(false);

    const loadNext = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            const { verseId, genre } = getNextVerseId();
            const verse = await fetchVerse(verseId);

            setCards(prev => {
                const uniqueId = `${verse.id}-${Date.now()}`;
                return [...prev, { ...verse, uniqueId, genre }];
            });

            // Check for login nudge trigger
            if (sessionState.scrollCount === 10) {
                setShowLoginNudge(true);
            }
        } catch (e) {
            console.error('Failed to load next verse', e);
        } finally {
            fetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            // Preload first 3 cards sequentially to avoid race conditions 
            // with algorithm logic (which relies on state changes)
            await loadNext();
            await loadNext();
            await loadNext();
            setLoadingInitial(false);
        };
        init();
    }, [loadNext]);

    return (
        <>
            <div className="scroll-container">
                {loadingInitial && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                    </div>
                )}
                {cards.map((card, i) => {
                    // Trigger fetch early so the user doesn't hit the bottom
                    const isTriggerPoint = i >= cards.length - 2;
                    return (
                        <QuoteCard
                            key={card.uniqueId}
                            verse={card}
                            loadNext={isTriggerPoint ? loadNext : null}
                        />
                    );
                })}
            </div>
            {showLoginNudge && (
                <ScrollPrompt onClose={() => setShowLoginNudge(false)} />
            )}
        </>
    );
}
