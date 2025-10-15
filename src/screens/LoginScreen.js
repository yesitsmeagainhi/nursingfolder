import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { signIn } from '../services/authService';
import { THEME } from '../utils/map';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const goSignup = () => navigation.replace('Signup');

  const onLogin = async () => {
    if (!email || !password) return;
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigation.replace('Home');
    } catch (e) {
      alert(e?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
      <Text style={s.h1}>Welcome back 👋</Text>
      <TextInput placeholder="Email" style={s.input} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      <TextInput placeholder="Password" style={s.input} secureTextEntry value={password} onChangeText={setPassword}/>
      <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={onLogin} disabled={busy}>
        <Text style={s.btnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goSignup}><Text style={s.link}>Create account</Text></TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f4f7fb', padding: 20, justifyContent: 'center' },
  h1: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#111827' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginVertical: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  btn: { backgroundColor: THEME, padding: 14, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 16, color: THEME, fontWeight: '600', textAlign: 'center' },
});
