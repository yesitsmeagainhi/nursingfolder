// App.tsx
import React, { useEffect } from 'react';
import { Platform, StatusBar, PermissionsAndroid, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ContactScreen from './src/screens/ContactScreen';
import ExplorerScreen from './src/screens/ExplorerScreen';
import ViewerScreen from './src/screens/ViewerScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import CourseDetailsScreen from './src/screens/CourseDetailsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AIScreen from './src/screens/AIScreen';

import { go, navigationRef } from './src/navigation/navRef';
import { ensureDefaultChannel } from './src/utils/notifyInit';
import { addNotification } from './src/utils/notificationsStorage';

// ────────────────────────────────────────────────────────────────────────────────
// Call this ONLY AFTER LOGIN (exported so Login can import & call it)
export async function initNotifications(selectedCourseId?: string) {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    await messaging().requestPermission().catch(() => { });
    await ensureDefaultChannel();

    // Subscriptions (topic broadcast). Do this AFTER login so guests don't get them.
    await messaging().subscribeToTopic('all');
    if (selectedCourseId) {
      const topic = `course_${String(selectedCourseId).toLowerCase()}`;
      await messaging().subscribeToTopic(topic);
    }

    const token = await messaging().getToken();
    console.log('FCM token:', token);
  } catch (e) {
    console.log('initNotifications error', e);
  }
}
// ────────────────────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();

function toItem(remoteMessage: any) {
  const id = remoteMessage?.data?.id || remoteMessage?.messageId || `${Date.now()}_${Math.random()}`;
  const n = remoteMessage?.notification || {};
  const d = remoteMessage?.data || {};
  const title = n.title || d.title || 'Update';
  const body = n.body || d.body || '';
  const receivedAt = Date.now();
  return { id, title, body, data: d, receivedAt, __origin: 'push' };
}

function handleNavigationFromMessage(data?: Record<string, string>) {
  if (!data) return;
  const screen = (data.screen || data.type || '').toLowerCase();
  const bestUrl = data.url || data.embedUrl || data.videoUrl;

  switch (screen) {
    case 'video':
    case 'videoplayer':
    case 'viewer':
      go('Viewer', { title: data.title || 'Video', type: 'video', url: bestUrl, embedUrl: data.embedUrl, nodeId: data.nodeId });
      break;
    case 'notifications':
    case 'notificationsscreen':
      go('Notifications');
      break;
    case 'explorer':
      go('Explorer', { title: data.title || 'Explorer', path: data.path });
      break;
    case 'contact':
      go('Contact');
      break;
    case 'course':
    case 'coursedetails':
      go('CourseDetails', { courseId: data.courseId, title: data.title || 'Course' });
      break;
    default:
      go('Home');
  }
}

function RootNavigator() {
  const { width } = Dimensions.get('window');
  const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

  useEffect(() => {
    // Channel first
    ensureDefaultChannel();

    // 1) Foreground FCM → show local notification + save to local inbox
    const unsubscribeOnMessage = messaging().onMessage(async (rm) => {
      await ensureDefaultChannel();
      const item = toItem(rm);
      await addNotification(item);

      await notifee.displayNotification({
        id: item.id, // stable -> dedupe
        title: item.title,
        body: item.body,
        android: {
          channelId: 'default',
          smallIcon: 'ic_launcher',
          pressAction: { id: 'open-notifications' }, // opens the app
        },
        data: { nav: 'Notifications', ...rm.data },
      });
    });

    // 2) User tapped system notification while app is in background
    const unsubscribeOpened = messaging().onNotificationOpenedApp((rm) => {
      if (rm?.data) handleNavigationFromMessage(rm.data);
    });

    // 3) App was cold-started by tapping a notification
    (async () => {
      const initialFCM = await messaging().getInitialNotification();
      if (initialFCM?.data) handleNavigationFromMessage(initialFCM.data);

      const initialLocal = await notifee.getInitialNotification();
      const localData = initialLocal?.notification?.data as any;
      if (localData) {
        if (localData.nav === 'Notifications') go('Notifications');
        else handleNavigationFromMessage(localData);
      }
    })();

    // 4) Taps on notifications while app is foregrounded
    const unsubscribeNotifeeFg = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const data = detail.notification?.data as any;
        if (data?.nav === 'Notifications') go('Notifications');
        else handleNavigationFromMessage(data);
      }
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOpened();
      unsubscribeNotifeeFg();
    };
  }, []);

  return (
    <>
      <StatusBar backgroundColor="#195ed2" barStyle="light-content" translucent={false} />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#195ed2' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700', fontSize: Math.round(18 * scale) },
            headerTitleAlign: 'left',
            headerShadowVisible: false,
            headerTopInsetEnabled: true,
            statusBarColor: '#195ed2',
            statusBarStyle: 'light',
            statusBarTranslucent: false,
            contentStyle: { backgroundColor: '#fff' },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
          <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact Us' }} />
          <Stack.Screen name="AI" component={AIScreen} options={{ title: 'AI Assistant' }} />
          <Stack.Screen name="Explorer" component={ExplorerScreen} options={({ route }) => ({ title: (route as any).params?.title || 'Explorer' })} />
          <Stack.Screen name="Viewer" component={ViewerScreen} options={({ route }) => ({ title: (route as any).params?.title || 'Viewer' })} />
          <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: 'Video' }} />
          <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Course' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
