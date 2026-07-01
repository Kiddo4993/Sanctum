import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RenderHtml from "react-native-render-html";
import { COLORS, FONTS } from "../theme";
import { recordInteraction } from "../services/AlgorithmService";
import { isLiked, toggleLike, isSaved, toggleSave } from "../services/LikeService";

// Approximate NavBar height: icon row (26) + paddingTop (12) + paddingBottom (dynamic, ~8-34)
const NAV_BAR_BASE = 50;

export default function QuoteCard({ verse }) {
    const { reference, content, genre } = verse;
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const heartScale = useRef(new Animated.Value(1)).current;
    const bookmarkScale = useRef(new Animated.Value(1)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        isLiked(verse.id).then(setLiked);
        isSaved(verse.id).then(setSaved);
    }, [verse.id]);

    const handlePress = () => {
        recordInteraction(genre);
    };

    const handleLike = async () => {
        const newLiked = await toggleLike(verse);
        setLiked(newLiked);

        Animated.parallel([
            Animated.sequence([
                Animated.spring(heartScale, {
                    toValue: 1.45,
                    useNativeDriver: true,
                    speed: 28,
                    bounciness: 18,
                }),
                Animated.spring(heartScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 14,
                }),
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
            fontSize: width > 600 ? 28 : 22,
            lineHeight: width > 600 ? 40 : 32,
            textAlign: "center",
            marginBottom: 20,
            fontStyle: "italic",
        },
    };

    // Action buttons sit above the nav bar
    const actionButtonBottom = Math.max(insets.bottom, 8) + NAV_BAR_BASE + 16;

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View style={[styles.cardContainer, { width, height }]}>
                <View style={[styles.contentWrapper, { paddingTop: insets.top + 16 }]}>
                    <RenderHtml
                        contentWidth={width - 64}
                        source={{ html: content }}
                        tagsStyles={tagsStyles}
                    />
                    <Text style={styles.referenceText}>{reference}</Text>
                </View>

                {/* Right-side action buttons */}
                <View style={[styles.actionButtons, { bottom: actionButtonBottom }]}>
                    <TouchableOpacity onPress={handleLike} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Animated.View
                            style={[
                                { transform: [{ scale: heartScale }] },
                                liked && styles.heartGlow,
                            ]}
                        >
                            <Ionicons
                                name={liked ? "heart" : "heart-outline"}
                                size={36}
                                color={liked ? "#ff2d55" : "rgba(255,255,255,0.75)"}
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={async () => {
                            const newSaved = await toggleSave(verse);
                            setSaved(newSaved);
                            Animated.sequence([
                                Animated.spring(bookmarkScale, { toValue: 1.4, useNativeDriver: true, speed: 28, bounciness: 16 }),
                                Animated.spring(bookmarkScale, { toValue: 1, useNativeDriver: true, speed: 14 }),
                            ]).start();
                        }}
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Animated.View
                            style={[
                                { transform: [{ scale: bookmarkScale }] },
                                saved && styles.bookmarkGlow,
                            ]}
                        >
                            <Ionicons
                                name={saved ? "bookmark" : "bookmark-outline"}
                                size={32}
                                color={saved ? COLORS.accentGold : "rgba(255,255,255,0.75)"}
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="share-social-outline" size={34} color="rgba(255,255,255,0.75)" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    contentWrapper: {
        maxWidth: 500,
        width: "100%",
        alignItems: "center",
    },
    referenceText: {
        fontFamily: FONTS.sans,
        fontSize: 13,
        color: COLORS.textSecondary,
        letterSpacing: 1.5,
        textTransform: "uppercase",
    },
    actionButtons: {
        position: "absolute",
        right: 20,
        alignItems: "center",
        gap: 28,
    },
    heartGlow: {
        shadowColor: "#ff2d55",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
        elevation: 6,
    },
    bookmarkGlow: {
        shadowColor: "#C9A84C",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
    },
});
