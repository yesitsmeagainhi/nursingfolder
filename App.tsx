// App.tsx
import React, { useEffect, useState } from 'react';
import {
  Platform,
  StatusBar,
  PermissionsAndroid,
  Dimensions,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';

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

// Utils
import { go, navigationRef } from './src/navigation/navRef';
import { ensureDefaultChannel } from './src/utils/notifyInit';
import { addNotification } from './src/utils/notificationsStorage';

const Stack = createNativeStackNavigator();

/** ---------- helpers to keep types safe ---------- **/
const asStr = (v: any): string | undefined =>
  typeof v === 'string'
    ? v
    : v == null
      ? undefined
      : (typeof v === 'object' ? JSON.stringify(v) : String(v));

const asStringRecord = (obj: any): Record<string, string> =>
  Object.fromEntries(
    Object.entries(obj || {}).map(([k, v]) => [k, asStr(v) ?? ''])
  );

/** ------------------------------------------------- **/

// Call this ONLY AFTER LOGIN (or when auth state becomes non-null)
export async function initNotifications(selectedCourseId?: string) {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }

    // ⬇️ Add these two lines near the top
    await messaging().registerDeviceForRemoteMessages().catch(() => { });
    await messaging().requestPermission().catch(() => { });

    await ensureDefaultChannel();

    // ⬇️ Keep/ensure the topic subscription here (this runs after login)
    await messaging().subscribeToTopic('all')
      .then(() => console.log('[FCM] subscribed: all'))
      .catch((e) => console.log('[FCM] subscribe err', e)); if (selectedCourseId) {
        const topic = `course_${String(selectedCourseId).toLowerCase()}`;
        await messaging().subscribeToTopic(topic).catch(() => { });
      }

    const token = await messaging().getToken();
    console.log('FCM token:', token);
  } catch (e) {
    console.log('initNotifications error', e);
  }
}



function toItem(remoteMessage: any) {
  const id =
    remoteMessage?.data?.id ||
    remoteMessage?.messageId ||
    `${Date.now()}_${Math.random()}`;
  const n = remoteMessage?.notification || {};
  const d = remoteMessage?.data || {};
  const title = asStr(n.title) || asStr(d.title) || 'Update';
  const body = asStr(n.body) || asStr(d.body) || '';
  const receivedAt = Date.now();
  return { id, title, body, data: d, receivedAt, __origin: 'push' as const };
}

function handleNavigationFromMessage(data?: Record<string, any>) {
  if (!data) return;

  const nav = (asStr(data.nav) || '').toLowerCase();
  const screen = (asStr(data.screen) || asStr(data.type) || nav).toLowerCase();
  const bestUrl =
    asStr(data.url) || asStr(data.embedUrl) || asStr(data.videoUrl) || undefined;

  // Short-circuit for Notifications
  if (nav === 'notifications' || screen === 'notifications' || screen === 'notificationsscreen') {
    go('Notifications');
    return;
  }

  switch (screen) {
    case 'video':
    case 'videoplayer':
    case 'viewer':
      go('Viewer', {
        title: asStr(data.title) || 'Video',
        type: 'video',
        url: bestUrl,
        embedUrl: asStr(data.embedUrl),
        nodeId: asStr(data.nodeId),
      });
      return;

    case 'explorer':
      go('Explorer', { title: asStr(data.title) || 'Explorer', path: asStr(data.path) });
      return;

    case 'contact':
      go('Contact');
      return;

    case 'course':
    case 'coursedetails':
      go('CourseDetails', { courseId: asStr(data.courseId), title: asStr(data.title) || 'Course' });
      return;

    default:
      go('Home');
  }
}

function useNotificationHandlers(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let unsubOnMessage = () => { };
    let unsubOpened = () => { };
    let unsubNotifeeFg = () => { };

    (async () => {
      await ensureDefaultChannel();

      // 1) Foreground FCM → local notif + save to inbox
      unsubOnMessage = messaging().onMessage(async (rm) => {
        await ensureDefaultChannel();

        const n = rm?.notification || {};
        const d = rm?.data || {};

        const title = asStr(n.title) || asStr(d.title) || 'Update';
        const body = asStr(n.body) || asStr(d.body) || '';

        await addNotification({
          id: rm?.messageId || String(Date.now()),
          title,
          body,
          receivedAt: Date.now(),
          data: d,
          __origin: 'push',
        });

        await notifee.displayNotification({
          id: rm?.messageId || undefined,
          title,
          body,
          android: {
            channelId: 'default',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'open-notifications' },
          },
          // Notifee expects Record<string, string>
          data: asStringRecord({ nav: 'Notifications', ...d }),
        });
      });

      // 2) App in background → user taps push
      unsubOpened = messaging().onNotificationOpenedApp((rm) => {
        const d: any = rm?.data;
        if (!d) return;

        if ((asStr(d.nav) || '').toLowerCase() === 'notifications') {
          go('Notifications');
        } else {
          handleNavigationFromMessage(d);
        }
      });

      // 3) Cold start via notification
      const initialFCM = await messaging().getInitialNotification();
      console.log('[getInitialNotification]', initialFCM?.data);

      if (initialFCM?.data) handleNavigationFromMessage(initialFCM.data as any);

      const initialLocal = await notifee.getInitialNotification();
      const localData = (initialLocal?.notification?.data ?? null) as any;
      if (localData) {
        if ((asStr(localData.nav) || '').toLowerCase() === 'notifications') go('Notifications');
        else handleNavigationFromMessage(localData);
      }

      // 4) Foreground Notifee taps
      unsubNotifeeFg = notifee.onForegroundEvent(({ type, detail }) => {
        console.log('[notifee.onForegroundEvent]', type, detail?.notification?.data);

        if (type === EventType.PRESS) {
          const data = detail.notification?.data as any;
          if ((asStr(data?.nav) || '').toLowerCase() === 'notifications') go('Notifications');
          else handleNavigationFromMessage(data);
        }
      });
    })();

    return () => {
      try { unsubOnMessage(); } catch { }
      try { unsubOpened(); } catch { }
      try { unsubNotifeeFg(); } catch { }
    };
  }, [enabled]);
}

function AppNavigator() {
  const { width } = Dimensions.get('window');
  const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#195ed2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: Math.round(18 * scale) },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        // removed headerTopInsetEnabled (invalid)
        statusBarColor: '#195ed2',
        statusBarStyle: 'light',
        statusBarTranslucent: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact Us' }} />
      <Stack.Screen name="AI" component={AIScreen} options={{ title: 'AI Assistant' }} />
      <Stack.Screen
        name="Explorer"
        component={ExplorerScreen}
        options={({ route }) => ({
          title: (route as any).params?.title || 'Explorer',
        })}
      />
      <Stack.Screen
        name="Viewer"
        component={ViewerScreen}
        options={({ route }) => ({
          title: (route as any).params?.title || 'Viewer',
        })}
      />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: 'Video' }} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Course' }} />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  const { width } = Dimensions.get('window');
  const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#195ed2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: Math.round(18 * scale) },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<null | { uid: string }>(null);

  // Auth gate — restores session after force-close (long-lived refresh token)
  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (u) => {
      setUser(u ? { uid: u.uid } : null);
      setReady(true);

      if (u) {
        try {
          await initNotifications();
        } catch { }
      }
    });
    return unsub;
  }, []);

  // Notification handlers only when app UI is up
  useNotificationHandlers(ready);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#195ed2" barStyle="light-content" />
      <NavigationContainer ref={navigationRef}>
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
