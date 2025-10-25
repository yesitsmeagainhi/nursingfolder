import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signIn } from '../services/authService';
import { THEME } from '../utils/map';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.wrap}
    >
      <Text style={s.h1}>Welcome back 👋</Text>

      {/* Email input */}
      <TextInput
        placeholder="Email address"
        placeholderTextColor="#9ca3af"
        style={s.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password input with eye toggle */}
      <View style={s.passwordContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          style={s.passwordInput}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={s.eyeButton}
        >
          <Icon
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#6b7280"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[s.btn, busy && { opacity: 0.6 }]}
        onPress={onLogin}
        disabled={busy}
      >
        <Text style={s.btnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goSignup}>
        <Text style={s.link}>Create account</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    padding: 20,
    justifyContent: 'center',
  },
  h1: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: '#111827',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 12,
  },
  btn: {
    backgroundColor: THEME,
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  link: {
    marginTop: 16,
    color: THEME,
    fontWeight: '600',
    textAlign: 'center',
  },
});
