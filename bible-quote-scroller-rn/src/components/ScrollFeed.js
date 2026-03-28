import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { getVerse } from '../services/QuoteService';
import { getNextVerseId, sessionState, recordInteraction, initAlgorithm } from '../services/AlgorithmService';
import { loadRecentQuotes } from '../services/CacheManager';
import QuoteCard from './QuoteCard';
import ScrollPrompt from './ScrollPrompt';
import { COLORS } from '../theme';

const { height } = Dimensions.get('window');

export default function ScrollFeed() {
    const [cards, setCards] = useState([]);
    const [showLoginNudge, setShowLoginNudge] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);

    const fetchingRef = useRef(false);

    const loadNext = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            const { verseId, genre } = getNextVerseId();
            const verse = await getVerse(verseId, genre);

            setCards(prev => {
                const uniqueId = `${verse.id}-${Date.now()}`;
                return [...prev, { ...verse, uniqueId, genre }];
            });

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
            // Restore algorithm memory
            await initAlgorithm();

            // Load last viewed quote
            const cachedQuotes = await loadRecentQuotes();
            
            if (cachedQuotes && cachedQuotes.length > 0) {
                // Resume exact position by injecting the most recent quote as the first item
                const lastQuote = cachedQuotes[cachedQuotes.length - 1];
                const uniqueId = `${lastQuote.id}-${Date.now()}`;
                
                setCards([{ ...lastQuote, uniqueId, genre: lastQuote.genre || 'wisdom' }]);
                sessionState.seen.add(lastQuote.id);

                // Create a scroll buffer immediately below it
                await loadNext();
                await loadNext();
            } else {
                // Fallback for brand-new install
                await loadNext();
                await loadNext();
                await loadNext();
            }

            setLoadingInitial(false);
        };
        init();
    }, [loadNext]);

    // Handle 3-second dwell time for visible items
    const dwellTimers = useRef(new Map());

    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        // Clear old timers that are no longer viewable
        const currentlyViewableIds = new Set(viewableItems.map(item => item.key));

        for (const [id, timer] of dwellTimers.current.entries()) {
            if (!currentlyViewableIds.has(id)) {
                clearTimeout(timer);
                dwellTimers.current.delete(id);
            }
        }

        // Set new timers for items that just became viewable
        viewableItems.forEach(({ item }) => {
            if (!dwellTimers.current.has(item.uniqueId)) {
                const timer = setTimeout(() => {
                    recordInteraction(item.genre);
                }, 3000);
                dwellTimers.current.set(item.uniqueId, timer);
            }
        });
    }, []);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 60,
        minimumViewTime: 100,
    };

    return (
        <View style={styles.container}>
            {loadingInitial ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accentGold} />
                </View>
            ) : (
                <FlatList
                    data={cards}
                    keyExtractor={(item) => item.uniqueId}
                    renderItem={({ item }) => <QuoteCard verse={item} />}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadNext}
                    onEndReachedThreshold={1.5}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    removeClippedSubviews={true}
                    initialNumToRender={3}
                    windowSize={5}
                    snapToInterval={height}
                    snapToAlignment="start"
                    decelerationRate="fast"
                />
            )}
            <ScrollPrompt
                visible={showLoginNudge}
                onClose={() => setShowLoginNudge(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});
