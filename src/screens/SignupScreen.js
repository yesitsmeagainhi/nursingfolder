// // src/screens/SignupScreen.js
// import React, { useMemo, useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   StatusBar,
//   ScrollView,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { signUp } from '../services/authService';
// import { THEME } from '../utils/map';

// export default function SignupScreen({ navigation }) {
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [busy, setBusy] = useState(false);
//   const [err, setErr] = useState('');

//   const onChangePhone = (v) => {
//     const digits = (v || '').replace(/\D/g, '').slice(0, 10);
//     setPhone(digits);
//     setErr('');
//   };

//   const isValidPhone = useMemo(() => /^\d{10}$/.test(phone), [phone]);
//   const isValidPassword = useMemo(() => (password || '').length >= 6, [password]);
//   const canSubmit = isValidPhone && isValidPassword && !busy;

//   const onSignup = async () => {
//     if (!canSubmit) {
//       if (!isValidPhone) setErr('Enter a valid 10-digit mobile number.');
//       else if (!isValidPassword) setErr('Password must be at least 6 characters.');
//       return;
//     }
//     setBusy(true);
//     setErr('');
//     try {
//       await signUp(phone, password); // expects (local10, password)
//       navigation.replace('Home');
//     } catch (e) {
//       const map = {
//         'invalid-10-digit': 'Enter a valid 10-digit mobile number.',
//         'auth/weak-password': 'Password must be at least 6 characters.',
//         'auth/email-already-in-use': 'This mobile is already registered. Try signing in.',
//         'auth/operation-not-allowed': 'Email/Password sign-up is disabled in Firebase.',
//         'auth/network-request-failed': 'Network error. Check your connection.',
//       };
//       setErr(map[e?.code] || 'Signup failed. Please try again.');
//       console.warn('Signup error:', e);
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       style={styles.wrap}
//     >
//       <StatusBar backgroundColor={THEME} barStyle="light-content" />

//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         keyboardShouldPersistTaps="handled"
//       >
//         <View style={styles.header}>
//           <Text style={styles.h1}>Create your account</Text>
//           <Text style={styles.sub}>Start learning faster with ABS</Text>
//         </View>

//         <View style={styles.card}>
//           {/* Phone */}
//           <View
//             style={[
//               styles.inputRow,
//               !isValidPhone && phone.length > 0 && styles.inputError,
//             ]}
//           >
//             <Icon name="phone-outline" size={20} color="#6b7280" style={styles.leftIcon} />
//             <TextInput
//               placeholder="Mobile Number (10 digits)"
//               placeholderTextColor="#9ca3af"
//               style={styles.inputField}
//               keyboardType="phone-pad"
//               inputMode="numeric"
//               autoCapitalize="none"
//               autoCorrect={false}
//               value={phone}
//               onChangeText={onChangePhone}
//               maxLength={10}
//               returnKeyType="next"
//             />
//           </View>
//           {!isValidPhone && phone.length > 0 ? (
//             <Text style={styles.helper}>Enter a 10-digit mobile number.</Text>
//           ) : null}

//           {/* Password */}
//           <View
//             style={[
//               styles.inputRow,
//               !isValidPassword && password.length > 0 && styles.inputError,
//             ]}
//           >
//             <Icon name="lock-outline" size={20} color="#6b7280" style={styles.leftIcon} />
//             <TextInput
//               placeholder="Password (min 6 characters)"
//               placeholderTextColor="#9ca3af"
//               style={styles.inputField}
//               secureTextEntry={!showPassword}
//               value={password}
//               onChangeText={(v) => { setPassword(v); setErr(''); }}
//               autoCapitalize="none"
//               autoCorrect={false}
//               returnKeyType="done"
//             />
//             <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
//               <Icon
//                 name={showPassword ? 'eye-off-outline' : 'eye-outline'}
//                 size={20}
//                 color="#6b7280"
//               />
//             </TouchableOpacity>
//           </View>
//           {!isValidPassword && password.length > 0 ? (
//             <Text style={styles.helper}>Password must be at least 6 characters.</Text>
//           ) : null}

//           {!!err && (
//             <View style={styles.errorBox}>
//               <Icon name="alert-circle-outline" size={18} color="#ef4444" />
//               <Text style={styles.errorText}>{err}</Text>
//             </View>
//           )}

//           <TouchableOpacity
//             style={[styles.btn, !canSubmit && { opacity: 0.6 }]}
//             onPress={onSignup}
//             disabled={!canSubmit}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.btnText}>{busy ? 'Creating…' : 'Sign up'}</Text>
//           </TouchableOpacity>

//           <Text style={styles.terms}>
//             By continuing, you agree to our <Text style={styles.termsLink}>Terms</Text> &{' '}
//             <Text style={styles.termsLink}>Privacy Policy</Text>.
//           </Text>
//         </View>

//         <TouchableOpacity onPress={() => navigation.replace('Login')}>
//           <Text style={styles.link}>I already have an account</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   wrap: {
//     flex: 1,
//     backgroundColor: '#f4f7fb',
//   },
//   scroll: {
//     padding: 20,
//     paddingBottom: 32,
//     justifyContent: 'center',
//     flexGrow: 1,
//   },
//   header: {
//     marginBottom: 12,
//     alignItems: 'center',
//   },
//   h1: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: '#111827',
//   },
//   sub: {
//     marginTop: 4,
//     color: '#6b7280',
//     fontSize: 14,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     // subtle shadow
//     shadowColor: '#000',
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 3,
//   },

//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     marginVertical: 8,
//     paddingHorizontal: 10,
//   },
//   leftIcon: { marginRight: 6 },
//   inputField: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#111827',
//   },
//   eyeButton: { paddingHorizontal: 8, paddingVertical: 10 },

//   inputError: { borderColor: '#ef4444' },
//   helper: { color: '#ef4444', fontSize: 12, marginTop: -2, marginBottom: 6 },

//   errorBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#fee2e2',
//     borderColor: '#fecaca',
//     borderWidth: 1,
//     padding: 10,
//     borderRadius: 10,
//     marginTop: 6,
//   },
//   errorText: { color: '#b91c1c', flex: 1 },

//   btn: {
//     backgroundColor: THEME,
//     paddingVertical: 14,
//     borderRadius: 12,
//     marginTop: 12,
//     alignItems: 'center',
//   },
//   btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

//   terms: {
//     textAlign: 'center',
//     color: '#6b7280',
//     fontSize: 12,
//     marginTop: 10,
//   },
//   termsLink: {
//     color: THEME,
//     fontWeight: '600',
//   },

//   link: {
//     marginTop: 16,
//     color: THEME,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
// });
// src/screens/SignupScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
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
  const isValidPassword = useMemo(() => (password || '').length >= 6, [password]);
  const canSubmit = isValidPhone && isValidPassword && !busy;

  const onSignup = async () => {
    if (!canSubmit) {
      if (!isValidPhone) setErr('Enter a valid 10-digit mobile number.');
      else if (!isValidPassword) setErr('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await signUp(phone, password); // expects (local10, password)
      navigation.replace('Home');
    } catch (e) {
      const map = {
        'invalid-10-digit': 'Enter a valid 10-digit mobile number.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/email-already-in-use': 'This mobile is already registered. Try signing in.',
        'auth/operation-not-allowed': 'Email/Password sign-up is disabled in Firebase.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      setErr(map[e?.code] || 'Signup failed. Please try again.');
      console.warn('Signup error:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrap}
    >
      <StatusBar backgroundColor={THEME} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tabs toggle under the brand header */}
        <View style={styles.tabsRow}>
          <TouchableOpacity style={styles.tab} onPress={() => navigation.replace('Login')} activeOpacity={0.9}>
            <Text style={styles.tabText}>Login</Text>
          </TouchableOpacity>
          <View style={[styles.tab, styles.tabActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Sign up</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.h1}>Create your account</Text>
          <Text style={styles.sub}>Start learning faster with ABS</Text>
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
          <View
            style={[
              styles.inputRow,
              !isValidPassword && password.length > 0 && styles.inputError,
            ]}
          >
            <Icon name="lock-outline" size={20} color="#6b7280" style={styles.leftIcon} />
            <TextInput
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#9ca3af"
              style={styles.inputField}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => { setPassword(v); setErr(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onSignup}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
          {!isValidPassword && password.length > 0 ? (
            <Text style={styles.helper}>Password must be at least 6 characters.</Text>
          ) : null}

          {!!err && (
            <View style={styles.errorBox}>
              <Icon name="alert-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{err}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, !canSubmit && { opacity: 0.6 }]}
            onPress={onSignup}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{busy ? 'Creating…' : 'Sign up'}</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our <Text style={styles.termsLink}>Terms</Text> &{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.link}>I already have an account</Text>
        </TouchableOpacity>
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

  // Tabs toggle (same look as Login)
  tabsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#eaf1fe',
    borderRadius: 9999,
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d7e4ff',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: THEME,
  },
  tabText: {
    color: '#1e293b',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
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

  terms: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
    marginTop: 10,
  },
  termsLink: {
    color: THEME,
    fontWeight: '600',
  },

  link: {
    marginTop: 16,
    color: THEME,
    fontWeight: '600',
    textAlign: 'center',
  },
});
