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
// src/screens/LoginScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
      if (!isValidPhone) setErr('Enter a valid 10-digit mobile number.');
      else if (!password) setErr('Enter your password.');
      return;
    }
    setBusy(true);
    setErr('');
    try {

      await signIn(phone, password); // expects local 10-digit phone + password
      // navigation.replace('Home');
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
      style={styles.wrap}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.h1}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue learning</Text>
        </View>

        <View style={styles.card}>
          {/* Phone */}
          <View
            style={[
              styles.inputRow,
              !isValidPhone && phone.length > 0 && styles.inputError,
            ]}
          >
            <Icon name="phone-outline" size={20} color="#6b7280" style={styles.leftIcon} />
            <TextInput
              placeholder="Mobile Number (10 digits)"
              placeholderTextColor="#9ca3af"
              style={styles.inputField}
              keyboardType="phone-pad"
              inputMode="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              value={phone}
              onChangeText={onChangePhone}
              maxLength={10}
              returnKeyType="next"
            />
          </View>
          {!isValidPhone && phone.length > 0 ? (
            <Text style={styles.helper}>Enter a 10-digit mobile number.</Text>
          ) : null}

          {/* Password */}
          <View style={[styles.inputRow, !password && styles.inputBase]}>
            <Icon name="lock-outline" size={20} color="#6b7280" style={styles.leftIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              style={styles.inputField}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => { setPassword(v); setErr(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {!!err && (
            <View style={styles.errorBox}>
              <Icon name="alert-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{err}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, !canSubmit && { opacity: 0.6 }]}
            onPress={onLogin}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>

        {/* <TouchableOpacity onPress={goSignup}>
          <Text style={styles.link}>Create account</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  scroll: {
    padding: 20,
    paddingBottom: 32,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    marginBottom: 12,
    alignItems: 'center',
  },
  h1: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  sub: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  inputBase: { borderColor: '#e5e7eb' },
  leftIcon: { marginRight: 6 },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: { paddingHorizontal: 8, paddingVertical: 10 },

  inputError: { borderColor: '#ef4444' },
  helper: { color: '#ef4444', fontSize: 12, marginTop: -2, marginBottom: 6 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  errorText: { color: '#b91c1c', flex: 1 },

  btn: {
    backgroundColor: THEME,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  link: {
    marginTop: 16,
    color: THEME,
    fontWeight: '600',
    textAlign: 'center',
  },
});
