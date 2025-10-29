import React from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AIScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <Icon name="robot" size={64} color="#2980b9" />
                    <Text style={styles.title}>AI Assistant</Text>
                    <Text style={styles.text}>
                        This is your AI hub — coming soon with smart features for learning and productivity!
                    </Text>
                </View>

                {/* ✅ Fixed bottom navigation */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity
                        style={styles.navItemActive}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Icon name="home" size={22} color="#166534" />
                        <Text style={styles.navTextActive}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.aiButton} activeOpacity={0.8}>
                        <Icon name="robot" size={32} color="#2980b9" />
                        <Text style={styles.navTextSoon}>AI coming soon</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItemActive}
                        onPress={() => navigation.navigate('Contact')}
                    >
                        <Icon name="contacts" size={22} color="#166534" />
                        <Text style={styles.navTextActive}>Contact Us</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 10,
    },
    text: {
        fontSize: 15,
        color: '#4b5563',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 30,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingVertical: 10,
    },
    navItemActive: { alignItems: 'center' },
    navTextActive: { color: '#166534', fontSize: 12, fontWeight: '600' },
    aiButton: { alignItems: 'center' },
    navTextSoon: { color: '#2980b9', fontSize: 12, marginTop: 4 },
});
