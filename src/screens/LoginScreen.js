// // src/screens/LoginScreen.js
// import React, { useMemo, useState } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity, StyleSheet,
//   KeyboardAvoidingView, Platform
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { signIn } from '../services/authService';
// import { THEME } from '../utils/map';

// export default function LoginScreen({ navigation }) {
//   const [countryCode, setCountryCode] = useState('91'); // default India
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [busy, setBusy] = useState(false);
//   const [err, setErr] = useState('');

//   // ---- inputs ----
//   const onChangeCC = (v) => {
//     const digits = (v || '').replace(/\D/g, '').slice(0, 3);
//     setCountryCode(digits);
//     setErr('');
//   };
//   const onChangePhone = (v) => {
//     const digits = (v || '').replace(/\D/g, '').slice(0, 10);
//     setPhone(digits);
//     setErr('');
//   };

//   // ---- validation ----
//   const isValidCC = useMemo(() => /^\d{1,3}$/.test(countryCode), [countryCode]);
//   const isValidPhone = useMemo(() => /^\d{10}$/.test(phone), [phone]);
//   const canSubmit = isValidCC && isValidPhone && password && !busy;
//   const e164 = useMemo(
//     () => (isValidCC && isValidPhone ? `+${countryCode}${phone}` : ''),
//     [countryCode, phone, isValidCC, isValidPhone]
//   );

//   const goSignup = () => navigation.replace('Signup');

//   const onLogin = async () => {
//     if (!canSubmit) {
//       if (!isValidCC) setErr('Enter a valid country code (1–3 digits).');
//       else if (!isValidPhone) setErr('Enter a 10-digit mobile number.');
//       return;
//     }
//     setBusy(true);
//     setErr('');
//     try {
//       await signIn(e164, password); // uses synthetic email inside authService
//       navigation.replace('Home');
//     } catch (e) {
//       const map = {
//         'auth/user-not-found': 'No account found for this mobile.',
//         'auth/wrong-password': 'Incorrect password.',
//         'auth/too-many-requests': 'Too many attempts. Try again later.',
//         'auth/operation-not-allowed': 'Email/Password provider is disabled in Firebase.',
//       };
//       setErr(map[e?.code] || 'Login failed. Please try again.');
//       console.warn('Login error:', e);
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       style={s.wrap}
//     >
//       <Text style={s.h1}>Welcome back 👋</Text>

//       {/* Country code + phone row */}
//       <View style={[s.row, (!isValidCC || (!isValidPhone && phone.length > 0)) && s.rowError]}>
//         <View style={s.ccWrap}>
//           <Text style={s.plus}>+</Text>
//           <TextInput
//             placeholder="CC"
//             style={s.ccInput}
//             keyboardType="number-pad"
//             inputMode="numeric"
//             value={countryCode}
//             onChangeText={onChangeCC}
//             maxLength={3}
//           />
//         </View>

//         <TextInput
//           placeholder="Mobile Number"
//           style={s.phoneInput}
//           keyboardType="phone-pad"
//           inputMode="numeric"
//           autoCapitalize="none"
//           value={phone}
//           onChangeText={onChangePhone}
//           maxLength={10}
//         />
//       </View>

//       {/* Password + eye */}
//       <View style={s.passwordContainer}>
//         <TextInput
//           placeholder="Password"
//           placeholderTextColor="#9ca3af"
//           style={s.passwordInput}
//           secureTextEntry={!showPassword}
//           value={password}
//           onChangeText={(v) => { setPassword(v); setErr(''); }}
//           autoCapitalize="none"
//           autoCorrect={false}
//         />
//         <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeButton}>
//           <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6b7280" />
//         </TouchableOpacity>
//       </View>

//       {!!err && <Text style={s.errorText}>{err}</Text>}

//       <TouchableOpacity
//         style={[s.btn, !canSubmit && { opacity: 0.6 }]}
//         onPress={onLogin}
//         disabled={!canSubmit}
//       >
//         <Text style={s.btnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
//       </TouchableOpacity>

//       <TouchableOpacity onPress={goSignup}>
//         <Text style={s.link}>Create account</Text>
//       </TouchableOpacity>
//     </KeyboardAvoidingView>
//   );
// }

// const s = StyleSheet.create({
//   wrap: { flex: 1, backgroundColor: '#f4f7fb', padding: 20, justifyContent: 'center' },
//   h1: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#111827' },

//   // CC + phone row
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     marginVertical: 8,
//   },
//   rowError: { borderColor: '#ef4444' },

//   ccWrap: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     borderRightWidth: 1,
//     borderRightColor: '#e5e7eb',
//     height: 48,
//   },
//   plus: { fontSize: 16, color: '#111827', marginRight: 4 },
//   ccInput: { width: 44, paddingVertical: 0, color: '#111827' },

//   phoneInput: { flex: 1, paddingHorizontal: 12, height: 48, color: '#111827' },

//   passwordContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     marginVertical: 8,
//   },
//   passwordInput: { flex: 1, padding: 14, fontSize: 16, color: '#111827' },
//   eyeButton: { paddingHorizontal: 12 },

//   errorText: { color: '#ef4444', marginTop: 6 },

//   btn: {
//     backgroundColor: THEME,
//     padding: 14,
//     borderRadius: 12,
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   btnText: { color: '#fff', fontWeight: '700' },

//   link: { marginTop: 16, color: THEME, fontWeight: '600', textAlign: 'center' },
// });
// src/screens/LoginScreen.js
import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signIn } from '../services/authService';
import { THEME } from '../utils/map';

export default function LoginScreen({ navigation }) {
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

  const goSignup = () => navigation.replace('Signup');

  const onLogin = async () => {
    if (!canSubmit) {
      if (!isValidPhone) setErr('Enter a 10-digit mobile number.');
      else if (!password) setErr('Enter your password.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await signIn(phone, password); // authService expects local 10-digit phone
      navigation.replace('Home');
    } catch (e) {
      const map = {
        'invalid-10-digit': 'Enter a valid 10-digit mobile number.',
        'auth/user-not-found': 'No account found for this mobile.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/operation-not-allowed': 'Email/Password provider is disabled in Firebase.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      setErr(map[e?.code] || 'Login failed. Please try again.');
      console.warn('Login error:', e);
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

      {/* Mobile (10 digits) */}
      <TextInput
        placeholder="Mobile Number (10 digits)"
        placeholderTextColor="#9ca3af"
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
          placeholderTextColor="#9ca3af"
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

      <TouchableOpacity
        style={[s.btn, !canSubmit && { opacity: 0.6 }]}
        onPress={onLogin}
        disabled={!canSubmit}
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
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 12,
  },

  errorText: { color: '#ef4444', marginTop: 6 },

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
