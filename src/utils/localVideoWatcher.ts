// // src/utils/localVideoWatcher.ts
// import firestore from '@react-native-firebase/firestore';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { Platform, PermissionsAndroid } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { addNotification } from './notificationsStorage';

// const LAST_TS_KEY = 'lastVideoNotifiedAt';
// const NOTIFIED_IDS_KEY = 'notifiedVideoIds';
// const CHANNEL_ID = 'default';

// // Simple guard to prevent parallel notifications
// let isProcessing = false;

// function isVideoNode(d: any) {
//     const t = String(d?.type || '').toLowerCase();
//     return ['video', 'videos', 'youtube', 'mp4'].includes(t);
// }

// function toMillis(ts: any): number {
//     if (!ts) return 0;
//     if (typeof ts === 'number') return ts;
//     if (typeof ts === 'object' && typeof ts.seconds === 'number')
//         return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
//     return 0;
// }

// async function ensurePermissionsAndChannel() {
//     if (Platform.OS === 'android' && Platform.Version >= 33) {
//         await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
//     }
//     try { await notifee.requestPermission(); } catch { }
//     if (Platform.OS === 'android') {
//         await notifee.createChannel({
//             id: CHANNEL_ID,
//             name: 'Default',
//             importance: AndroidImportance.HIGH,
//         });
//     }
// }

// export async function startLocalVideoWatcher() {
//     await ensurePermissionsAndChannel();

//     let lastSeen = 0;
//     const seenIds = new Set<string>();

//     try {
//         const [savedTs, savedIds] = await Promise.all([
//             AsyncStorage.getItem(LAST_TS_KEY),
//             AsyncStorage.getItem(NOTIFIED_IDS_KEY),
//         ]);
//         if (savedTs) lastSeen = parseInt(savedTs, 10) || 0;
//         if (savedIds) JSON.parse(savedIds).forEach((id: string) => seenIds.add(id));
//     } catch { }

//     const q = firestore()
//         .collection('nodes')
//         .orderBy('createdAt', 'desc')
//         .limit(20);

//     const unsub = q.onSnapshot(async (snap) => {
//         // Baseline run
//         if (lastSeen === 0 && snap.docs.length) {
//             const newest = snap.docs[0]?.data();
//             const newestTs =
//                 toMillis(newest?.createdAt) || toMillis(newest?.updatedAt) || Date.now();
//             lastSeen = newestTs;
//             await AsyncStorage.setItem(LAST_TS_KEY, String(lastSeen));
//             console.log('[watcher] baseline set');
//             return;
//         }

//         if (isProcessing) return;
//         isProcessing = true;

//         try {
//             for (const change of snap.docChanges()) {
//                 if (change.type !== 'added') continue;
//                 if (change.doc.metadata.hasPendingWrites) continue;

//                 const d: any = { id: change.doc.id, ...change.doc.data() };
//                 if (!isVideoNode(d)) continue;

//                 const ts = toMillis(d.createdAt) || toMillis(d.updatedAt) || Date.now();
//                 if (ts <= lastSeen || seenIds.has(d.id)) continue;

//                 seenIds.add(d.id);
//                 lastSeen = ts;
//                 await AsyncStorage.multiSet([
//                     [LAST_TS_KEY, String(lastSeen)],
//                     [NOTIFIED_IDS_KEY, JSON.stringify(Array.from(seenIds))],
//                 ]);

//                 const title = d.name || 'New video added';
//                 const body = d.subtitle || 'Tap to watch';
//                 const url = d.url || d.meta?.videoUrl || '';
//                 const embed = d.embedUrl || d.meta?.embedUrl || '';

//                 console.log('[watcher] notifying for', d.id, title);

//                 await notifee.displayNotification({
//                     title,
//                     body,
//                     data: {
//                         type: 'video',
//                         screen: 'Viewer',
//                         nodeId: d.id,
//                         title,
//                         url,
//                         embedUrl: embed,
//                     },
//                     android: {
//                         channelId: CHANNEL_ID,
//                         pressAction: {
//                             id: 'open',
//                             launchActivity: 'default', // enables click open
//                         },
//                     },
//                 });

//                 await addNotification({
//                     id: `local-${d.id}`,
//                     title,
//                     body,
//                     receivedAt: Date.now(),
//                     data: {
//                         type: 'video',
//                         screen: 'Viewer',
//                         nodeId: d.id,
//                         title,
//                         url,
//                         embedUrl: embed,
//                     },
//                 });
//             }
//         } catch (err) {
//             console.error('[watcher] error', err);
//         } finally {
//             isProcessing = false;
//         }
//     });

//     return unsub;
// }

// src/utils/localVideoWatcher.ts
import firestore from '@react-native-firebase/firestore';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addNotification } from './notificationsStorage';

const LAST_TS_KEY = 'lastVideoNotifiedAt';
const NOTIFIED_IDS_KEY = 'notifiedVideoIds';
const CHANNEL_ID = 'default';

// guard to prevent parallel processing of one snapshot tick
let isProcessing = false;

const isVideoNode = (d: any) =>
    ['video', 'videos', 'youtube', 'mp4'].includes(String(d?.type || '').toLowerCase());

const toMillis = (ts: any) =>
    !ts
        ? 0
        : typeof ts === 'number'
            ? ts
            : typeof ts === 'object' && typeof ts.seconds === 'number'
                ? ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6)
                : 0;

async function ensurePermissionsAndChannel() {
    // Android 13+ runtime permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    // iOS permission (no-op on Android)
    try {
        await notifee.requestPermission();
    } catch { }

    // Ensure Android channel
    if (Platform.OS === 'android') {
        await notifee.createChannel({
            id: CHANNEL_ID,
            name: 'Default',
            importance: AndroidImportance.HIGH,
        });
    }
}

export async function startLocalVideoWatcher() {
    await ensurePermissionsAndChannel();

    let lastSeen = 0;
    const seenIds = new Set<string>();

    try {
        const [savedTs, savedIds] = await Promise.all([
            AsyncStorage.getItem(LAST_TS_KEY),
            AsyncStorage.getItem(NOTIFIED_IDS_KEY),
        ]);
        if (savedTs) lastSeen = parseInt(savedTs, 10) || 0;
        if (savedIds) JSON.parse(savedIds).forEach((id: string) => seenIds.add(id));
    } catch { }

    const q = firestore().collection('nodes').orderBy('createdAt', 'desc').limit(20);

    const unsub = q.onSnapshot(async (snap) => {
        // first attach → set baseline, don't spam existing docs
        if (lastSeen === 0 && snap.docs.length) {
            const newest = snap.docs[0]?.data();
            lastSeen = toMillis(newest?.createdAt) || toMillis(newest?.updatedAt) || Date.now();
            await AsyncStorage.setItem(LAST_TS_KEY, String(lastSeen));
            return;
        }

        if (isProcessing) return;
        isProcessing = true;

        try {
            for (const change of snap.docChanges()) {
                // react only to new docs synced from server
                if (change.type !== 'added') continue;
                if (change.doc.metadata.hasPendingWrites) continue;

                const d: any = { id: change.doc.id, ...change.doc.data() };
                if (!isVideoNode(d)) continue;

                const ts = toMillis(d.createdAt) || toMillis(d.updatedAt) || Date.now();
                if (ts <= lastSeen) continue;
                if (seenIds.has(d.id)) continue;

                // advance watermark & remember this id
                lastSeen = ts;
                seenIds.add(d.id);
                await AsyncStorage.multiSet([
                    [LAST_TS_KEY, String(lastSeen)],
                    [NOTIFIED_IDS_KEY, JSON.stringify(Array.from(seenIds))],
                ]);

                const title = d.name || 'New video added';
                const url = d.url || d.meta?.videoUrl || '';
                const embed = d.embedUrl || d.meta?.embedUrl || '';

                // 👇 Panel vs stored message
                const panelBody = d.subtitle || 'View Notification';            // shown on phone notification panel
                const storedBody = d.subtitle || 'Tap to watch';  // shown inside NotificationsScreen

                // 🔔 Show system notification (tap opens Notifications screen)
                await notifee.displayNotification({
                    title,
                    body: panelBody, // only "TAP" (or subtitle if provided) appears on the panel
                    data: {
                        type: 'notifications',
                        screen: 'Notifications', // App.tsx handles this and navigates to Notifications screen
                    },
                    android: {
                        channelId: CHANNEL_ID,
                        pressAction: {
                            id: 'open',
                            launchActivity: 'default',
                        },
                    },
                });

                // 💾 Save once so it appears in your NotificationsScreen list
                await addNotification({
                    id: `local-${d.id}`,
                    title,
                    body: storedBody, // keep the longer text inside the app list
                    receivedAt: Date.now(),
                    data: {
                        type: 'video',        // tapping inside the list can take user to the video
                        screen: 'Viewer',
                        nodeId: d.id,
                        title,
                        url,
                        embedUrl: embed,
                    },
                });
            }
        } finally {
            isProcessing = false;
        }
    });

    return unsub; // caller should clean up on unmount
}

// src/utils/localVideoWatcher.ts
// import firestore from '@react-native-firebase/firestore';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { Platform, PermissionsAndroid } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { addNotification } from './notificationsStorage';

// const LAST_TS_KEY = 'lastVideoNotifiedAt';
// const NOTIFIED_IDS_KEY = 'notifiedVideoIds';
// const CHANNEL_ID = 'default';
// let isProcessing = false;

// const isVideoNode = (d: any) =>
//     ['video', 'videos', 'youtube', 'mp4'].includes(String(d?.type || '').toLowerCase());

// const toMillis = (ts: any) =>
//     !ts ? 0 :
//         typeof ts === 'number' ? ts :
//             (typeof ts === 'object' && typeof ts.seconds === 'number')
//                 ? ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6)
//                 : 0;

// async function ensurePermissionsAndChannel() {
//     if (Platform.OS === 'android' && Platform.Version >= 33) {
//         await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
//     }
//     try { await notifee.requestPermission(); } catch { }
//     if (Platform.OS === 'android') {
//         await notifee.createChannel({
//             id: CHANNEL_ID,
//             name: 'Default',
//             importance: AndroidImportance.HIGH,
//         });
//     }
// }

// export async function startLocalVideoWatcher() {
//     await ensurePermissionsAndChannel();

//     let lastSeen = 0;
//     const seenIds = new Set<string>();
//     try {
//         const [savedTs, savedIds] = await Promise.all([
//             AsyncStorage.getItem(LAST_TS_KEY),
//             AsyncStorage.getItem(NOTIFIED_IDS_KEY),
//         ]);
//         if (savedTs) lastSeen = parseInt(savedTs, 10) || 0;
//         if (savedIds) JSON.parse(savedIds).forEach((id: string) => seenIds.add(id));
//     } catch { }

//     const q = firestore().collection('nodes').orderBy('createdAt', 'desc').limit(20);

//     const unsub = q.onSnapshot(async (snap) => {
//         // first attach → baseline only
//         if (lastSeen === 0 && snap.docs.length) {
//             const newest = snap.docs[0]?.data();
//             lastSeen = toMillis(newest?.createdAt) || toMillis(newest?.updatedAt) || Date.now();
//             await AsyncStorage.setItem(LAST_TS_KEY, String(lastSeen));
//             return;
//         }

//         if (isProcessing) return;
//         isProcessing = true;
//         try {
//             for (const change of snap.docChanges()) {
//                 if (change.type !== 'added') continue;
//                 if (change.doc.metadata.hasPendingWrites) continue;

//                 const d: any = { id: change.doc.id, ...change.doc.data() };
//                 if (!isVideoNode(d)) continue;

//                 const ts = toMillis(d.createdAt) || toMillis(d.updatedAt) || Date.now();
//                 if (ts <= lastSeen || seenIds.has(d.id)) continue;

//                 // advance watermark & remember this id
//                 lastSeen = ts;
//                 seenIds.add(d.id);
//                 await AsyncStorage.multiSet([
//                     [LAST_TS_KEY, String(lastSeen)],
//                     [NOTIFIED_IDS_KEY, JSON.stringify(Array.from(seenIds))],
//                 ]);

//                 const title = d.name || 'New video added';
//                 const body = d.subtitle || 'Tap to view Notifications';
//                 const url = d.url || d.meta?.videoUrl || '';
//                 const embed = d.embedUrl || d.meta?.embedUrl || '';

//                 // show system notification (tappable)
//                 await notifee.displayNotification({
//                     title,
//                     body,
//                     data: {
//                         type: 'notifications',
//                         screen: 'Notifications',
//                         // nodeId: d.id,
//                         // title,
//                         // url,
//                         // embedUrl: embed,
//                     },
//                     android: {
//                         channelId: CHANNEL_ID,
//                         pressAction: { id: 'open', launchActivity: 'default' },
//                     },
//                 });

//                 // save exactly once so it shows in NotificationsScreen
//                 await addNotification({
//                     id: `local-${d.id}`,
//                     title,
//                     body,
//                     receivedAt: Date.now(),
//                     data: { type: 'video', screen: 'Viewer', nodeId: d.id, title, url, embedUrl: embed },
//                 });
//             }
//         } finally {
//             isProcessing = false;
//         }
//     });

//     return unsub;
// }
