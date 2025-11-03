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
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const FAB_EMAIL_DOMAIN = 'phoneuser.nursinglecture.com';

function phoneToEmail(local10) {
  const digits = (local10 || '').replace(/\D/g, '');
  if (!/^\d{10}$/.test(digits)) {
    const err = new Error('invalid-10-digit');
    err.code = 'invalid-10-digit';
    throw err;
  }
  return `${digits}@${FAB_EMAIL_DOMAIN}`;
}

function normalizeUsername(raw) {
  const u = (raw || '').trim().toLowerCase();
  if (!/^[a-z0-9._]{3,20}$/.test(u)) {
    const err = new Error('invalid-username');
    err.code = 'invalid-username';
    throw err;
  }
  return u;
}

export async function signUp(local10, password, username) {
  if (!password || password.length < 6) {
    const err = new Error('weak-password');
    err.code = 'auth/weak-password';
    throw err;
  }
  const email = phoneToEmail(local10);
  const usernameLower = normalizeUsername(username);

  const cred = await auth().createUserWithEmailAndPassword(email, password);
  const uid = cred.user.uid;

  const usernamesRef = firestore().collection('usernames').doc(usernameLower);
  const userRef = firestore().collection('users').doc(uid);

  try {
    await firestore().runTransaction(async (txn) => {
      const unameSnap = await txn.get(usernamesRef);
      if (unameSnap.exists) {
        const err = new Error('username-taken');
        err.code = 'username-taken';
        throw err;
      }
      txn.set(userRef, {
        uid,
        username: usernameLower,
        phoneLocal10: local10.replace(/\D/g, ''),
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      txn.set(usernamesRef, {
        uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (e) {
    try { await cred.user.delete(); } catch { }
    throw e;
  }

  try { await cred.user.updateProfile({ displayName: usernameLower }); } catch { }
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
