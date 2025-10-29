// src/screens/AIScreen.js
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform, ScrollView,
    StatusBar, TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SafeBottomBar from '../components/SafeBottomBar';
import SafeHeader from '../components/SafeHeader';
const BOTTOM_BAR_BASE = 56; // keep identical to HomeScreen

export default function AIScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

    // Same bottom space the bar occupies so content never overlaps it
    const bottomPad = Math.max(insets.bottom, 10);
    const bottomBarMinH = BOTTOM_BAR_BASE + bottomPad;

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            {/* Match HomeScreen status bar behavior */}
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingBottom: bottomBarMinH + 12, // EXACTLY like HomeScreen
                        minHeight: height - bottomBarMinH,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header identical logic to HomeScreen (safe-area handled inside SafeHeader) */}
                    {/* <SafeHeader
                        scale={scale}
                        bg="#195ed2"
                        leftIcon="menu"
                        rightIcon="bell-outline"
                        onPressLeft={() => navigation.navigate('Home')}
                        onPressRight={() => navigation.navigate('Notifications')}
                    >
                        <Text
                            style={[
                                styles.headerTitle,
                                { fontSize: 32 * scale, marginTop: 20 * scale, marginBottom: 20 * scale },
                            ]}
                        >
                            AI Assistant
                        </Text>
                    </SafeHeader> */}

                    {/* Body */}
                    <View style={styles.container}>
                        <Icon name="robot" size={64 * scale} color="#2980b9" />
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
    center: { alignItems: 'center', justifyContent: 'center' },

    headerTitle: { fontWeight: 'bold', color: '#fff' },

    safe: { flex: 1, backgroundColor: '#f8fafc' },
    flex: { flex: 1 },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 10,
    },
    text: {
        color: '#4b5563',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 30,
    },
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
