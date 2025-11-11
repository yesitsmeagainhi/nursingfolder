// // src/services/authService.js
// import auth from '@react-native-firebase/auth';

// /**
//  * Convert "+919876543210" -> "p919876543210@abs.app"
//  * (We avoid '+' in the local-part and keep it deterministic)
//  */
// function phoneToEmail(e164) {
//   const normalized = (e164 || '').replace(/[^+\d]/g, '');
//   if (!/^\+\d{8,15}$/.test(normalized)) {
//     throw new Error('invalid-e164');
//   }
//   const local = normalized.replace('+', 'p');  // e.g. p919876543210
//   return `${local}@abs.app`;
// }

// export async function signUp(e164, password) {
//   if (!password || password.length < 6) {
//     // Firebase requires >= 6 chars
//     throw Object.assign(new Error('weak-password'), { code: 'auth/weak-password' });
//   }

//   const email = phoneToEmail(e164);

//   // Create Firebase user with email+password
//   const cred = await auth().createUserWithEmailAndPassword(email, password);

//   // Optional: store the real phone in the profile
//   await cred.user.updateProfile({ displayName: e164 });

//   return cred.user;
// }

// export async function signIn(e164, password) {
//   const email = phoneToEmail(e164);
//   const cred = await auth().signInWithEmailAndPassword(email, password);
//   return cred.user;
// }

// export async function signOut() {
//   return auth().signOut();
// }
// src/services/authService.js
// src/services/authService.js
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const FAB_EMAIL_DOMAIN = 'phoneuser.nursinglecture.com';

// Convert a 10-digit mobile to a fabricated email (for Firebase Email/Password)
function phoneToEmail(local10) {
  const digits = (local10 || '').replace(/\D/g, '');
  if (!/^\d{10}$/.test(digits)) {
    const err = new Error('invalid-10-digit');
    err.code = 'invalid-10-digit';
    throw err;
  }
  return `${digits}@${FAB_EMAIL_DOMAIN}`;
}

export async function signUp(local10, password) {
  if (!password || password.length < 6) {
    const err = new Error('weak-password');
    err.code = 'auth/weak-password';
    throw err;
  }

  const email = phoneToEmail(local10);
  const cred = await auth().createUserWithEmailAndPassword(email, password);
  const uid = cred.user.uid;

  // Create (or merge) a basic user profile document
  const phoneDigits = String(local10).replace(/\D/g, '');
  await firestore().collection('users').doc(uid).set({
    uid,
    phoneLocal10: phoneDigits,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // (Optional) No displayName / username updates anymore
  return cred.user;
}

export async function signIn(local10, password) {
  const email = phoneToEmail(local10);
  const cred = await auth().signInWithEmailAndPassword(email, password);
  return cred.user;
}

export async function signOut() {
  return auth().signOut();
}
