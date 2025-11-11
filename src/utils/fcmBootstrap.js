

// src/utils/fcmBootstrap.js
import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { addNotification } from './notificationsStorage'; // see step 4

export async function initFCM(onToken) {
    // ANDROID 13+ runtime permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
        const res = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        // You can check res === 'granted'
    }

    // iOS/Android: request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    // Token
    const token = await messaging().getToken();
    onToken?.(token);
    console.log('FCM token:', token);

    // Foreground messages (app open)
    const unsubOnMessage = messaging().onMessage(async remoteMessage => {
        // Save for your NotificationsScreen
        await safePersist(remoteMessage);
    });

    // If the app was opened from a quit state by tapping a notif
    const initial = await messaging().getInitialNotification();
    if (initial) {
        await safePersist(initial);
    }

    // If the app is in background and user taps the notif
    const unsubOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
        if (remoteMessage) await safePersist(remoteMessage);
    });

    return () => {
        unsubOnMessage?.();
        unsubOpened?.();
    };
}

async function safePersist(remoteMessage) {
    try {
        // remoteMessage.notification?.title/body is the human text when using "notification" payload
        const payload = {
            id: remoteMessage?.messageId || String(Date.now()),
            title: remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Notification',
            body: remoteMessage?.notification?.body || remoteMessage?.data?.body || '',
            receivedAt: Date.now(),
            data: remoteMessage?.data || {},
        };
        await addNotification(payload);
    } catch (e) {
        console.warn('Failed to persist notification', e);
    }
}
