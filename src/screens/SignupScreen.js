// src/screens/SignupScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signUp } from '../services/authService';
import { THEME } from '../utils/map';

export default function SignupScreen({ navigation }) {
  const [countryCode, setCountryCode] = useState('91'); // default India
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // --- Inputs & validation ---
  const onChangeCC = (v) => {
    const digits = (v || '').replace(/\D/g, '').slice(0, 3); // allow up to 3 digits
    setCountryCode(digits);
    setErr('');
  };

  const onChangePhone = (v) => {
    const digits = (v || '').replace(/\D/g, '').slice(0, 10); // 10 digits local
    setPhone(digits);
    setErr('');
  };

  const isValidCC = useMemo(() => /^\d{1,3}$/.test(countryCode), [countryCode]);
  const isValidPhone = useMemo(() => /^\d{10}$/.test(phone), [phone]);
  const canSubmit = isValidCC && isValidPhone && password && !busy;

  const e164 = useMemo(() => (isValidCC && isValidPhone ? `+${countryCode}${phone}` : ''), [countryCode, phone, isValidCC, isValidPhone]);

  // --- Actions ---
  const onSignup = async () => {
    if (!canSubmit) {
      if (!isValidCC) setErr('Enter a valid country code (1–3 digits).');
      else if (!isValidPhone) setErr('Enter a 10-digit mobile number.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      // Ensure your authService accepts an E.164 phone (e.g., +919876543210)
      await signUp(e164, password);
      navigation.replace('Home');
    } catch (e) {
      // Show quiet inline message (no alerts)
      setErr('Signup failed. Please check details and try again.');
      console.warn('Signup error:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>Create account</Text>

      {/* Country code + phone row */}
      <View style={[s.row, (!isValidCC || (!isValidPhone && phone.length > 0)) && s.rowError]}>
        <View style={s.ccWrap}>
          <Text style={s.plus}>+</Text>
          <TextInput
            placeholder="CC"
            style={s.ccInput}
            keyboardType="number-pad"
            inputMode="numeric"
            value={countryCode}
            onChangeText={onChangeCC}
            maxLength={3}
          />
        </View>

        <TextInput
          placeholder="Mobile Number"
          style={s.phoneInput}
          keyboardType="phone-pad"
          inputMode="numeric"
          value={phone}
          onChangeText={onChangePhone}
          maxLength={10}
        />
      </View>

      {!isValidCC ? <Text style={s.helper}>Enter a valid country code (e.g., 91).</Text> : null}
      {!isValidPhone && phone.length > 0 ? (
        <Text style={s.helper}>Enter a 10-digit mobile number.</Text>
      ) : null}

      {/* Password + show/hide */}
      <View style={s.inputRow}>
        <TextInput
          placeholder="Password"
          style={s.inputFlex}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={(v) => { setPassword(v); setErr(''); }}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(v => !v)}
          style={s.eyeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {err ? <Text style={s.errorText}>{err}</Text> : null}

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

  // CC + phone row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 8,
  },
  rowError: { borderColor: '#ef4444' },

  ccWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    height: 48,
  },
  plus: { fontSize: 16, color: '#111827', marginRight: 4 },
  ccInput: { width: 44, paddingVertical: 0, color: '#111827' },

  phoneInput: { flex: 1, paddingHorizontal: 12, height: 48, color: '#111827' },

  helper: { color: '#ef4444', fontSize: 12, marginTop: -4, marginBottom: 6 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 8,
    paddingRight: 10,
  },
  inputFlex: { flex: 1, padding: 14 },
  eyeBtn: { paddingLeft: 8, paddingVertical: 6 },

  errorText: { color: '#ef4444', marginTop: 6 },

  btn: { backgroundColor: THEME, padding: 14, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 16, color: THEME, fontWeight: '600', textAlign: 'center' },
});
