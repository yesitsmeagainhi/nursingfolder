// src/screens/ContactUsScreen.js
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, SafeAreaView, KeyboardAvoidingView,
    Platform, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { Linking } from 'react-native';

const PHONE = '+919833211999';
const EMAIL = 'support@abseducation.in';
const ADDRESS_LINE = 'ABS Educational Solution, Bhayandar (W), Mumbai';
const MAP_Q = encodeURIComponent(ADDRESS_LINE);

export default function ContactUsScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const n = name.trim();
        const e = email.trim();
        const m = message.trim();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

        if (!n || !e || !m) {
            Alert.alert('Missing info', 'Please fill all fields.');
            return false;
        }
        if (!emailOk) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return false;
        }
        if (m.length < 10) {
            Alert.alert('Message too short', 'Please add a few more details.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            await firestore().collection('contactMessages').add({
                name: name.trim(),
                email: email.trim(),
                message: message.trim(),
                createdAt: firestore.FieldValue.serverTimestamp(),
            });
            setName('');
            setEmail('');
            setMessage('');
            Alert.alert('Thank you!', 'Your message has been sent. Our team will reach out soon.');
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Something went wrong. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const openDialer = () => Linking.openURL(`tel:${PHONE}`);
    const openWhatsApp = () =>
        Linking.openURL(`https://wa.me/${PHONE.replace('+', '')}?text=${encodeURIComponent('Hi ABS Team, I need help with...')}`);
    const openEmail = () =>
        Linking.openURL(`mailto:${EMAIL}?subject=${encodeURIComponent('Support Request')}`);
    const openMaps = () =>
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${MAP_Q}`);

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Header */}
                    {/* <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-left" size={26} color="#0f172a" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Contact Us</Text>
                        <View style={{ width: 26 }} />
                    </View> */}

                    {/* Intro Card */}
                    <View style={styles.hero}>
                        <View style={styles.heroIconWrap}>
                            <Icon name="headset" size={28} color="#166534" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroTitle}>We’re here to help</Text>
                            <Text style={styles.heroText}>
                                Have questions about admissions, courses, or support? Reach out anytime.
                            </Text>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.quickGrid}>
                        <TouchableOpacity style={styles.quickCard} onPress={openDialer} activeOpacity={0.8}>
                            <Icon name="phone" size={22} color="#166534" />
                            <Text style={styles.quickLabel}>Call</Text>
                            <Text style={styles.quickValue}>{PHONE.replace('+91', '+91 ')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickCard} onPress={openWhatsApp} activeOpacity={0.8}>
                            <Icon name="whatsapp" size={22} color="#166534" />
                            <Text style={styles.quickLabel}>WhatsApp</Text>
                            <Text style={styles.quickValue}>Chat now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickCard} onPress={openEmail} activeOpacity={0.8}>
                            <Icon name="email-outline" size={22} color="#166534" />
                            <Text style={styles.quickLabel}>Email</Text>
                            <Text style={styles.quickValue}>{EMAIL}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickCard} onPress={openMaps} activeOpacity={0.8}>
                            <Icon name="map-marker" size={22} color="#166534" />
                            <Text style={styles.quickLabel}>Directions</Text>
                            <Text style={styles.quickValue}>Open Maps</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divider Label */}
                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>Send us a message</Text>
                        <View style={styles.divider} />
                    </View>

                    {/* Form */}
                    <View style={styles.formCard}>
                        <View style={styles.inputRow}>
                            <Icon name="account" size={20} color="#6b7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Your Name"
                                placeholderTextColor="#9ca3af"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <Icon name="email" size={20} color="#6b7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Your Email"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                returnKeyType="next"
                            />
                        </View>

                        <View style={[styles.inputRow, styles.multilineWrap]}>
                            <Icon name="message-text-outline" size={20} color="#6b7280" style={styles.inputIconTop} />
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                placeholder="How can we help you?"
                                placeholderTextColor="#9ca3af"
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.submitText}>Send Message</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* SLA note */}
                        <View style={styles.noteRow}>
                            <Icon name="clock-outline" size={18} color="#6b7280" />
                            <Text style={styles.noteText}>Typical response within 24 hours (Mon–Sat)</Text>
                        </View>
                    </View>

                    {/* Address / Hours */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Icon name="office-building-marker" size={20} color="#111827" />
                            <Text style={styles.infoText}>{ADDRESS_LINE}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Icon name="calendar-clock" size={20} color="#111827" />
                            <Text style={styles.infoText}>Hours: 10:00 AM – 7:00 PM (Mon–Sat)</Text>
                        </View>
                    </View>

                    <View style={{ height: 24 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const RADIUS = 14;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { padding: 16 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },

    hero: {
        flexDirection: 'row', gap: 12, alignItems: 'center',
        backgroundColor: '#ecfdf5', borderColor: '#bbf7d0', borderWidth: 1,
        padding: 14, borderRadius: RADIUS, marginTop: 8, marginBottom: 14,
    },
    heroIconWrap: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#d1fae5',
    },
    heroTitle: { fontSize: 16, fontWeight: '700', color: '#065f46' },
    heroText: { fontSize: 14, color: '#065f46' },

    quickGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18,
    },
    quickCard: {
        flexGrow: 1, minWidth: '47%',
        backgroundColor: '#ffffff', borderRadius: RADIUS, padding: 14,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    quickLabel: { fontSize: 12, color: '#6b7280', marginTop: 6 },
    quickValue: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 2 },

    dividerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
    },
    divider: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
    dividerText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },

    formCard: {
        backgroundColor: '#fff', borderRadius: RADIUS,
        padding: 14, borderWidth: 1, borderColor: '#e5e7eb',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
        backgroundColor: '#fff', marginBottom: 10, paddingHorizontal: 10,
    },
    inputIcon: { marginRight: 8 },
    inputIconTop: { marginRight: 8, marginTop: 12 },
    input: {
        flex: 1, fontSize: 16, color: '#111827', paddingVertical: 12,
    },
    multilineWrap: { alignItems: 'flex-start' },
    textarea: { minHeight: 120 },

    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#166534', paddingVertical: 14, borderRadius: 12, marginTop: 6,
    },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    noteText: { color: '#6b7280', fontSize: 13 },

    infoCard: {
        backgroundColor: '#f1f5f9', borderRadius: RADIUS, padding: 14,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    infoText: { color: '#111827', fontSize: 14, flexShrink: 1 },
});
