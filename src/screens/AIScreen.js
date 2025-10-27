// src/screens/AIScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AIScreen() {
    return (
        <View style={styles.container}>
            <Icon name="robot" size={64} color="#7b61ff" />
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.text}>
                This is your AI hub — coming soon with smart features for learning and productivity!
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 16,
        marginBottom: 8,
    },
    text: {
        textAlign: 'center',
        color: '#475569',
        fontSize: 16,
        lineHeight: 22,
    },
});
