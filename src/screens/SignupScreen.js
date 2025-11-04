// src/screens/SignupScreen.js
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signUp } from '../services/authService';
import { THEME } from '../utils/map';

export default function SignupScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onChangePhone = (v) => {
    const digits = (v || '').replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    setErr('');
  };

  const isValidPhone = useMemo(() => /^\d{10}$/.test(phone), [phone]);
  const canSubmit = isValidPhone && !!password && !busy;

  const onSignup = async () => {
    if (!canSubmit) {
      if (!isValidPhone) setErr('Enter a 10-digit mobile number.');
      else if (!password) setErr('Enter a password.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await signUp(phone, password); // auth expects (local10, password)
      navigation.replace('Home');
    } catch (e) {
      const map = {
        'invalid-10-digit': 'Enter a valid 10-digit mobile number.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/email-already-in-use': 'Mobile already registered. Try signing in.',
        'auth/operation-not-allowed': 'Email/Password provider is disabled in Firebase.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      setErr(map[e?.code] || 'Signup failed. Please try again.');
      console.warn('Signup error:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>Create account</Text>

      {/* Mobile (10 digits) */}
      <TextInput
        placeholder="Mobile Number (10 digits)"
        style={[s.input, !isValidPhone && phone.length > 0 && s.inputError]}
        keyboardType="phone-pad"
        inputMode="numeric"
        autoCapitalize="none"
        autoCorrect={false}
        value={phone}
        onChangeText={onChangePhone}
        maxLength={10}
      />
      {!isValidPhone && phone.length > 0 ? (
        <Text style={s.helper}>Enter a 10-digit mobile number.</Text>
      ) : null}

      {/* Password + eye toggle */}
      <View style={s.passwordContainer}>
        <TextInput
          placeholder="Password"
          style={s.passwordInput}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(v) => { setPassword(v); setErr(''); }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeButton}>
          <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {!!err && <Text style={s.errorText}>{err}</Text>}

      <TouchableOpacity style={[s.btn, !canSubmit && { opacity: 0.6 }]} onPress={onSignup} disabled={!canSubmit}>
        <Text style={s.btnText}>{busy ? 'Creating…' : 'Sign up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Login')}>
        <Text style={s.link}>I have an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f4f7fb', padding: 20, justifyContent: 'center' },
  h1: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#111827' },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },
  inputError: { borderColor: '#ef4444' },
  helper: { color: '#ef4444', fontSize: 12, marginTop: -4, marginBottom: 6 },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 8,
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: '#111827' },
  eyeButton: { paddingHorizontal: 12 },

  errorText: { color: '#ef4444', marginTop: 6 },

  btn: { backgroundColor: THEME, padding: 14, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 16, color: THEME, fontWeight: '600', textAlign: 'center' },
});
