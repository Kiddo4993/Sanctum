import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, TouchableOpacity, Animated } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { COLORS, FONTS } from '../theme';
import { recordInteraction } from '../services/algorithm';
import { isLiked, toggleLike } from '../services/LikeService';

const { width, height } = Dimensions.get('window');

// Strip simple <p> tags if we don't want strict HTML rendering, but RenderHtml handles it well
export default function QuoteCard({ verse }) {
    const { reference, content, genre } = verse;
    const [liked, setLiked] = useState(false);
    const heartScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        isLiked(verse.id).then(setLiked);
    }, [verse.id]);

    const handlePress = () => {
        recordInteraction(genre);
    };

    const handleLike = async () => {
        // Bounce animation
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 30 }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
        ]).start();

        const newLiked = await toggleLike(verse);
        setLiked(newLiked);
        if (newLiked) recordInteraction(genre); // extra signal for the algorithm
    };

    const tagsStyles = {
        p: {
            color: COLORS.textPrimary,
            fontFamily: FONTS.serifItalic,
            fontSize: width > 600 ? 32 : 24, // Responsive roughly
            lineHeight: width > 600 ? 44 : 34,
            textAlign: 'center',
            marginBottom: 24,
            fontStyle: 'italic',
        },
    };

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View style={styles.cardContainer}>
                <View style={styles.contentWrapper}>
                    <RenderHtml
                        contentWidth={width - 64}
                        source={{ html: content }}
                        tagsStyles={tagsStyles}
                    />
                    <Text style={styles.referenceText}>{reference}</Text>
                </View>

                {/* TikTok-style heart button */}
                <TouchableOpacity style={styles.heartButton} onPress={handleLike} activeOpacity={0.8}>
                    <Animated.Text style={[styles.heartIcon, { transform: [{ scale: heartScale }] }]}>
                        {liked ? '❤️' : '🤍'}
                    </Animated.Text>
                </TouchableOpacity>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    contentWrapper: {
        maxWidth: 800,
        width: '100%',
        alignItems: 'center',
    },
    referenceText: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        color: COLORS.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    heartButton: {
        position: 'absolute',
        right: 24,
        bottom: 120,
        alignItems: 'center',
        gap: 4,
    },
    heartIcon: {
        fontSize: 36,
    },
});
