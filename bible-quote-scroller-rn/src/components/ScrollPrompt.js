import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { COLORS, FONTS } from '../theme';

export default function ScrollPrompt({ visible, onClose }) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.sheet}>
                            <Text style={styles.title}>Want to save your preferences?</Text>
                            <Text style={styles.description}>Sign up to carry your personalized feed across devices.</Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
                                    <Text style={styles.primaryButtonText}>Sign Up (Coming in Version 2)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                                    <Text style={styles.secondaryButtonText}>Not Now</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.sheetBackground,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: 24,
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    description: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
        marginBottom: 24,
    },
    buttonContainer: {
        gap: 12, // gap is supported in newer React Native versions
        marginTop: 8,
    },
    primaryButton: {
        backgroundColor: COLORS.accentGold,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        fontFamily: FONTS.sansBold,
        fontSize: 16,
        color: '#000',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontFamily: FONTS.sansBold,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
});
