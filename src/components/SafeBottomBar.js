// src/components/SafeBottomBar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BOTTOM_BAR_BASE = 56; // same across all screens

/**
 * Props:
 * - scale: number
 * - active: 'home' | 'ai' | 'contact'
 * - onHome, onAI, onContact: functions
 * - forceColorsLikeHome: boolean (when true, match HomeScreen's icon/label colors exactly)
 */
export default function SafeBottomBar({
    scale = 1,
    active = 'home',
    onHome,
    onAI,
    onContact,
    forceColorsLikeHome = false,
}) {
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom, 10);
    const minH = BOTTOM_BAR_BASE + bottomPad;

    // Colors (match HomeScreen when forced)
    const green = '#166534';
    const blue = '#195ed2';
    const gray = '#6b7280';

    const homeIconColor = forceColorsLikeHome ? green : (active === 'home' ? green : gray);
    const contactIconColor = forceColorsLikeHome ? green : (active === 'contact' ? green : gray);
    const aiIconColor = forceColorsLikeHome ? blue : (active === 'ai' ? blue : gray);

    const homeTextStyle = [styles.text, { fontSize: 12 * scale }, forceColorsLikeHome ? styles.textActive : (active === 'home' && styles.textActive)];
    const contactTextStyle = [styles.text, { fontSize: 12 * scale }, forceColorsLikeHome ? styles.textActive : (active === 'contact' && styles.textActive)];
    const aiTextStyle = [styles.textSoon, { fontSize: 12 * scale }]; // always blue label like HomeScreen

    return (
        <View
            style={[
                styles.bar,
                {
                    paddingBottom: bottomPad,
                    paddingTop: 8,
                    minHeight: minH,
                },
            ]}
        >
            <TouchableOpacity style={styles.item} activeOpacity={0.9} onPress={onHome}>
                <Icon name="home" size={22 * scale} color={homeIconColor} />
                <Text style={homeTextStyle}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} activeOpacity={0.9} onPress={onAI}>
                <Icon name="robot" size={28 * scale} color={aiIconColor} />
                <Text style={aiTextStyle}>AI coming soon</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} activeOpacity={0.9} onPress={onContact}>
                <Icon name="contacts" size={22 * scale} color={contactIconColor} />
                <Text style={contactTextStyle}>Contact Us</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    item: { alignItems: 'center' },
    text: { color: '#6b7280', fontWeight: '600', marginTop: 4 },
    textActive: { color: '#166534' },
    textSoon: { color: '#195ed2', marginTop: 4 },
});
