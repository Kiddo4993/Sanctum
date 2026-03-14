import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        isLiked(verse.id).then(setLiked);
    }, [verse.id]);

    const handlePress = () => {
        recordInteraction(genre);
    };

    const handleLike = async () => {
        const newLiked = await toggleLike(verse);
        setLiked(newLiked);

        // Bounce + glow in/out
        Animated.parallel([
            Animated.sequence([
                Animated.spring(heartScale, { toValue: 1.45, useNativeDriver: true, speed: 28, bounciness: 18 }),
                Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 14 }),
            ]),
            Animated.timing(glowOpacity, {
                toValue: newLiked ? 1 : 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();

        if (newLiked) recordInteraction(genre);
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

                {/* Right-side action buttons */}
                <View style={styles.actionButtons}>
                    {/* Like button */}
                    <TouchableOpacity onPress={handleLike} activeOpacity={0.8}>
                        <Animated.View style={[
                            { transform: [{ scale: heartScale }] },
                            liked && styles.heartGlow,
                        ]}>
                            <Ionicons
                                name={liked ? 'heart' : 'heart-outline'}
                                size={38}
                                color={liked ? '#ff2d55' : 'rgba(255,255,255,0.75)'}
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Share button (UI only) */}
                    <TouchableOpacity activeOpacity={0.7}>
                        <Ionicons
                            name="share-social-outline"
                            size={36}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>
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
    actionButtons: {
        position: 'absolute',
        right: 24,
        bottom: 120,
        alignItems: 'center',
        gap: 24,
    },
    heartGlow: {
        shadowColor: '#ff2d55',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
        elevation: 6,
    },
});
