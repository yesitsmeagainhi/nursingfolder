/**
 * @format
 */

// index.js (top-level entry)
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { addNotification } from './src/utils/notificationsStorage';
import App from './App';
import { name as appName } from './app.json';

messaging().setBackgroundMessageHandler(async (rm) => {
    try {
        const item = {
            id: rm?.messageId || String(Date.now()),
            title: rm?.notification?.title || rm?.data?.title || 'Update',
            body: rm?.notification?.body || rm?.data?.body || '',
            receivedAt: Date.now(),
            data: rm?.data || {},
        };
        await addNotification(item);
        // no UI here; app is backgrounded/terminated
    } catch (e) {
        // swallow
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