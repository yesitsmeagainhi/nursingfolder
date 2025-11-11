// /**
//  * @format
//  */

// // index.js (top-level entry)
// // index.js (RN entry file)
// import 'react-native-gesture-handler';
// import { AppRegistry } from 'react-native';
// import messaging from '@react-native-firebase/messaging';
// import notifee, { EventType } from '@notifee/react-native';
// import { ensureDefaultChannel } from './src/utils/notifyInit';
// import { addNotification } from './src/utils/notificationsStorage';
// import App from './App';
// import { name as appName } from './app.json';
// // Helper: Notifee expects Record<string,string>
// const toStringRecord = (obj = {}) =>
//     Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v == null ? '' : String(v)]));

// // ONE background handler only
// messaging().setBackgroundMessageHandler(async (rm) => {
//     try {
//         console.log('[BG FCM] received', rm?.messageId, rm?.data);  // ⬅️ Add this

//         await ensureDefaultChannel();

//         const n = rm?.notification || {};
//         const d = rm?.data || {};

//         const title = String(n.title ?? d.title ?? 'Update');
//         const body = String(n.body ?? d.body ?? '');

//         // Save to your in-app inbox so NotificationsScreen can show it later
//         await addNotification({
//             id: rm?.messageId || String(Date.now()),
//             title,
//             body,
//             receivedAt: Date.now(),
//             data: d,
//             __origin: 'push',
//         });

//         // Show a system notification in tray
//         await notifee.displayNotification({
//             id: rm?.messageId, // optional
//             title,
//             body,
//             android: {
//                 channelId: 'default',
//                 smallIcon: 'ic_launcher',
//                 pressAction: { id: 'open-notifications' },
//             },
//             // Deep-link hints (strings only)
//             data: toStringRecord({ nav: 'Notifications', ...d }),
//         });
//     } catch (e) {
//         // avoid crashing headless task
//         console.log('[BG FCM] error', e);
//     }
// });

// // Handle taps when app is killed/background
// notifee.onBackgroundEvent(async ({ type /*, detail */ }) => {
//     if (type === EventType.PRESS) {
//         // no-op: App.tsx reads initial notification and navigates
//     }
// });

// AppRegistry.registerComponent(appName, () => App);


// // index.js
// // import { name as appName } from './app.json';

// // import { AppRegistry } from 'react-native';
// // import messaging from '@react-native-firebase/messaging';
// // import { addNotification } from './src/utils/notificationsStorage';
// // messaging().setBackgroundMessageHandler(async (rm) => {
// //     await addNotification({
// //         id: rm?.messageId || String(Date.now()),
// //         title: rm?.notification?.title || rm?.data?.title || 'Update',
// //         body: rm?.notification?.body || rm?.data?.body || '',
// //         receivedAt: Date.now(),
// //         data: rm?.data || {},
// //     });
// // });
// // AppRegistry.registerComponent(appName, () => App);




// index.js (RN entry file)
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { ensureDefaultChannel } from './src/utils/notifyInit';
import { addNotification } from './src/utils/notificationsStorage';
import App from './App';
import { name as appName } from './app.json';

// Helper: Notifee expects Record<string, string>
const toStringRecord = (obj = {}) =>
    Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, v == null ? '' : String(v)])
    );

// ---- SINGLE background handler ----
messaging().setBackgroundMessageHandler(async (rm) => {
    try {
        console.log('[BG FCM] received', rm?.messageId, rm?.data, rm?.notification);
        await ensureDefaultChannel();

        const n = rm?.notification || {};
        const d = rm?.data || {};

        const title = String(n.title ?? d.title ?? 'Update');
        const body = String(n.body ?? d.body ?? '');

        // Always store in the in-app inbox
        await addNotification({
            id: rm?.messageId || String(Date.now()),
            title,
            body,
            receivedAt: Date.now(),
            data: d,
            __origin: 'push',
        });

        // IMPORTANT:
        // If FCM already provided a `notification` payload, Android shows the banner.
        // Only show a local Notifee notification for *data-only* messages.
        if (!rm?.notification) {
            await notifee.displayNotification({
                id: rm?.messageId,
                title,
                body,
                android: {
                    channelId: 'default',
                    smallIcon: 'ic_launcher',
                    pressAction: { id: 'open-notifications' },
                },
                data: toStringRecord({ nav: 'Notifications', ...d }),
            });
        }
    } catch (e) {
        // never crash the headless task
        console.log('[BG FCM] error', e);
    }
});

// Handle taps when app is killed/background (navigation is handled in App.tsx)
notifee.onBackgroundEvent(async ({ type /*, detail */ }) => {
    if (type === EventType.PRESS) {
        // no-op
    }
});

AppRegistry.registerComponent(appName, () => App);
