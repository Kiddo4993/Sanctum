import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '../theme';

export default function EyeRestBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Show after 60 minutes
        const timer = setTimeout(() => {
            setShow(true);
        }, 60 * 60 * 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={show}
            onRequestClose={() => setShow(false)}
        >
            <View style={styles.overlay}>
                <View style={styles.messageContainer}>
                    <Text style={styles.title}>Time to Rest Your Eyes</Text>
                    <Text style={styles.description}>You've been reading for an hour. Take a moment to look away, breathe, and reflect.</Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={() => setShow(false)}>
                        <Text style={styles.primaryButtonText}>Resume Reading</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    messageContainer: {
        backgroundColor: COLORS.sheetBackground,
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        maxWidth: 500,
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: 24,
        color: COLORS.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
        marginBottom: 24,
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: COLORS.accentGold,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    primaryButtonText: {
        fontFamily: FONTS.sansBold,
        fontSize: 16,
        color: '#000',
    },
});
