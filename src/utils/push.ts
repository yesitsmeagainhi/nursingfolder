import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

export async function registerPushForUser(uid: string) {
    await messaging().requestPermission();               // ask once
    const token = await messaging().getToken();
    // save token under user doc so backend can target this user
    await firestore().collection('users').doc(uid)
        .collection('tokens').doc(token).set({
            token, platform: 'android', createdAt: Date.now(),
        }, { merge: true });

    // (optional) subscribe to a topic you’ll broadcast: org-wide or per-branch
    await messaging().subscribeToTopic('announcements');
}

export async function unregisterPush(uid?: string) {
    const token = await messaging().getToken();
    try {
        if (uid) {
            await firestore().collection('users').doc(uid)
                .collection('tokens').doc(token).delete();
        }
    } catch { }
    try { await messaging().unsubscribeFromTopic('announcements'); } catch { }
}
