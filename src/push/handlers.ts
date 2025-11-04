import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { ensureDefaultChannel } from '../utils/notifyInit';

// Background FCM -> show a local notification (data-only or with notification)
messaging().setBackgroundMessageHandler(async remoteMessage => {
    await ensureDefaultChannel();
    const t = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Announcement';
    const b = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';
    const id = remoteMessage?.data?.id || undefined; // use announcement doc id to dedupe
    await notifee.displayNotification({
        id, title: t, body: b,
        android: {
            channelId: 'default',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'open-notifications' },
        },
        data: { nav: 'Notifications', ...remoteMessage.data },
    });
});

// Handle taps while app is killed/background (optional – only if you want deep links)
// If you're already handling pressAction in App.tsx, you can skip this.
notifee.onBackgroundEvent(async ({ type, detail }) => {
    // no-op, your App.tsx will handle navigation when it starts
});
