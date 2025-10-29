// src/components/SafeHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * A reusable, safe-area aware header that paints under a translucent StatusBar
 * and adds correct top padding across devices (iOS notch, Android status bar, etc).
 *
 * Props:
 * - bg (string): background color (default #195ed2)
 * - scale (number): UI scale factor used for paddings/sizes
 * - leftIcon (string): MaterialCommunityIcons name
 * - rightIcon (string): MaterialCommunityIcons name
 * - onPressLeft (function)
 * - onPressRight (function)
 * - children: header body (title, search bar, etc.)
 */
export default function SafeHeader({
    bg = '#195ed2',
    scale = 1,
    leftIcon = 'menu',
    rightIcon = 'bell-outline',
    onPressLeft,
    onPressRight,
    children,
}) {
    const insets = useSafeAreaInsets();
    const safeTop = Math.max(
        insets.top || 0,
        Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
        10 * scale
    );

    return (
        <View
            style={[
                styles.header,
                {
                    backgroundColor: bg,
                    paddingTop: safeTop + 12 * scale,
                    paddingHorizontal: 20 * scale,
                    paddingBottom: 20 * scale,
                    borderBottomLeftRadius: 30 * scale,
                    borderBottomRightRadius: 30 * scale,
                },
            ]}
        >
            <View style={[styles.headerTopRow, { height: 44 * scale }]}>
                <TouchableOpacity onPress={onPressLeft} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name={leftIcon} size={28 * scale} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={onPressRight} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name={rightIcon} size={28 * scale} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Body (title, search, etc.) */}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        // backgroundColor applied inline
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
