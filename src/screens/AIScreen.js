// src/screens/AIScreen.js
import React from 'react';
import {
    View, Text, StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, TouchableOpacity, useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BOTTOM_BAR_BASE = 56; // same as HomeScreen

export default function AIScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

    // identical spacing logic as HomeScreen (bar manages bottom safe-area)
    const bottomPad = Math.max(insets.bottom, 10);
    const bottomBarMinH = BOTTOM_BAR_BASE + bottomPad;

    return (
        // ✅ Do NOT include 'bottom' here — avoid double padding
        <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingBottom: bottomBarMinH + 12, // exactly like HomeScreen
                        minHeight: height - bottomBarMinH,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.container}>
                        <Icon name="robot" size={64 * scale} color="#195ed2" />
                        <Text style={[styles.title, { fontSize: 22 * scale }]}>Coming Soon</Text>
                        <Text style={[styles.text, { fontSize: 15 * scale }]}>
                            This is your AI hub — coming soon with smart features for learning and productivity!
                        </Text>
                    </View>
                </ScrollView>

                {/* Bottom Nav (safe-area aware) — same as HomeScreen */}
                <View
                    style={[
                        styles.bottomNav,
                        {
                            paddingBottom: bottomPad,
                            paddingTop: 8,
                            minHeight: BOTTOM_BAR_BASE + bottomPad,
                        },
                    ]}
                >
                    <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('Home')}>
                        <Icon name="home" size={22 * scale} color="#166534" />
                        <Text style={[styles.navTextActive, { fontSize: 12 * scale }]}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navItem} activeOpacity={0.9}>
                        <Icon name="robot" size={28 * scale} color="#195ed2" />
                        <Text style={[styles.navTextSoon, { fontSize: 12 * scale }]}>AI coming soon</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('Contact')}>
                        <Icon name="contacts" size={22 * scale} color="#166534" />
                        <Text style={[styles.navTextActive, { fontSize: 12 * scale }]}>Contact Us</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: '#f8fafc' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    title: { fontWeight: '700', color: '#1f2937', marginTop: 10 },
    text: { color: '#4b5563', textAlign: 'center', marginTop: 10, paddingHorizontal: 30 },

    bottomNav: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    navItem: { alignItems: 'center' },
    navTextActive: { color: '#166534', fontWeight: '600', marginTop: 4 },
    navTextSoon: { color: '#195ed2', marginTop: 4 },
});
