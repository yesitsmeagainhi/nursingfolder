import notifee, { AndroidImportance } from '@notifee/react-native';

export async function ensureDefaultChannel() {
    await notifee.createChannel({
        id: 'default',
        name: 'General',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
    });
}
