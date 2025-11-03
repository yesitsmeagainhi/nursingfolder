// src/utils/pushTopics.js
import messaging from '@react-native-firebase/messaging';

export async function subscribeAllTopic() {
    try {
        await messaging().requestPermission(); // prompt once if needed
        await messaging().registerDeviceForRemoteMessages();
        await messaging().subscribeToTopic('all');
    } catch (e) { }
}
