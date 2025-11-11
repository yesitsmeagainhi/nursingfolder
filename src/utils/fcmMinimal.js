
//src/utils/fcmMinimal.js
import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { addNotification } from './notificationsStorage';

export async function initMinimalFCM() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    await messaging().requestPermission().catch(() => { });
    try { await messaging().subscribeToTopic('all'); } catch (e) { console.log('topic sub err', e); }

    messaging().onMessage(async (rm) => {
        await addNotification(toLocal(rm));
    });

    const initial = await messaging().getInitialNotification();
    if (initial) await addNotification(toLocal(initial));

    messaging().onNotificationOpenedApp(async (rm) => {
        if (rm) await addNotification(toLocal(rm));
    });
}

function toLocal(rm) {
    return {
        id: rm?.messageId || String(Date.now()),
        title: rm?.notification?.title || rm?.data?.title || 'Notification',
        body: rm?.notification?.body || rm?.data?.body || '',
        receivedAt: Date.now(),
        data: rm?.data || {},
    };
}
