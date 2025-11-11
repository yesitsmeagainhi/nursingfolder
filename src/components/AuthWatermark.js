import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/**
 * Props:
 * - imageSource?: require('../assets/auth-bg.png') or { uri }
 * - overlayColors?: string[] (default: very light wash)
 * - imageOpacity?: number (default: 0.25 so it's VISIBLE)
 */
export default function AuthWatermark({
    imageSource,
    overlayColors = ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.55)'],
    imageOpacity = 0.25,
    children,
}) {
    // If no image provided, just show the overlay gradient
    if (!imageSource) {
        return (
            <View style={styles.fill}>
                <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill} />
                <View style={styles.content}>{children}</View>
            </View>
        );
    }

    return (
        <ImageBackground
            source={imageSource}
            style={styles.fill}
            resizeMode="cover"
            imageStyle={{ opacity: imageOpacity }}
        >
            {/* keep a *light* wash so text/cards pop */}
            <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill} />
            <View style={styles.content}>{children}</View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1 },
});
