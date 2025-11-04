/**
 * @format
 */

// index.js (top-level entry)
// index.js (RN entry file)
import './src/push/handlers';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Show a notification when a data-message arrives in background/quit
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    const n = remoteMessage?.notification || {};
    const d = remoteMessage?.data || {};

    await notifee.displayNotification({
        title: n.title || d.title || 'Update',
        body: n.body || d.body || '',
        android: {
            channelId: 'default',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'open' },
        },
        // forward deep-link data
        data: d,
    });
});

// Ensure taps on notifications from killed state are captured
notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
        // Optionally persist deep link for App.tsx to read on cold start
        // e.g., await AsyncStorage.setItem('initialNav', JSON.stringify(detail.notification?.data||{}));
    }
});

AppRegistry.registerComponent(appName, () => App);

// index.js
// import { name as appName } from './app.json';

// import { AppRegistry } from 'react-native';
// import messaging from '@react-native-firebase/messaging';
// import { addNotification } from './src/utils/notificationsStorage';
// messaging().setBackgroundMessageHandler(async (rm) => {
//     await addNotification({
//         id: rm?.messageId || String(Date.now()),
//         title: rm?.notification?.title || rm?.data?.title || 'Update',
//         body: rm?.notification?.body || rm?.data?.body || '',
//         receivedAt: Date.now(),
//         data: rm?.data || {},
//     });
// });
// AppRegistry.registerComponent(appName, () => App);