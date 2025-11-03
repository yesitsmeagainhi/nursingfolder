// // // // App.tsx
// // // import React from 'react';
// // // import { NavigationContainer } from '@react-navigation/native';
// // // import { createNativeStackNavigator } from '@react-navigation/native-stack';
// // // import LoginScreen from './src/screens/LoginScreen';
// // // import SignupScreen from './src/screens/SignupScreen';
// // // import HomeScreen from './src/screens/HomeScreen';
// // // import ContactScreen from './src/screens/ContactScreen';
// // // import ExplorerScreen from './src/screens/ExplorerScreen';
// // // import ViewerScreen from './src/screens/ViewerScreen';
// // // import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
// // // import CourseDetailsScreen from './src/screens/CourseDetailsScreen';

// // // const Stack = createNativeStackNavigator();

// // // export default function App() {
// // //   return (
// // //     <NavigationContainer>
// // //       <Stack.Navigator>
// // //         {/* Auth */}
// // //         <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
// // //         <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />

// // //         {/* Main */}
// // //         <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
// // //         <Stack.Screen
// // //           name="Contact"
// // //           component={ContactScreen}
// // //           options={{ title: 'Contact Us' }}
// // //         />
// // //         <Stack.Screen name="Explorer" component={ExplorerScreen} options={({ route }) => ({ title: route.params?.title || 'Explorer' })} />
// // //         <Stack.Screen name="Viewer" component={ViewerScreen} options={({ route }) => ({ title: route.params?.title || 'Viewer' })} />
// // //         <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: 'Video' }} />
// // //         <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Course' }} />
// // //       </Stack.Navigator>
// // //     </NavigationContainer>
// // //   );
// // // }
// // // App.tsx
// // import React, { useEffect, useRef } from 'react';
// // import { Alert, Platform } from 'react-native';
// // import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
// // import { createNativeStackNavigator } from '@react-navigation/native-stack';

// // import LoginScreen from './src/screens/LoginScreen';
// // import SignupScreen from './src/screens/SignupScreen';
// // import HomeScreen from './src/screens/HomeScreen';
// // import ContactScreen from './src/screens/ContactScreen';
// // import ExplorerScreen from './src/screens/ExplorerScreen';
// // import ViewerScreen from './src/screens/ViewerScreen';
// // import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
// // import CourseDetailsScreen from './src/screens/CourseDetailsScreen';

// // import messaging from '@react-native-firebase/messaging';
// // // App.tsx (only showing additions/changes)
// // import { addNotification } from './src/utils/notificationsStorage';
// // import NotificationsScreen from './src/screens/NotificationsScreen';

// // // inside <Stack.Navigator>

// // function toItem(remoteMessage: any) {
// //   // normalize payload
// //   const id = remoteMessage?.messageId || `${Date.now()}_${Math.random()}`;
// //   const title = remoteMessage?.notification?.title || 'Update';
// //   const body = remoteMessage?.notification?.body || '';
// //   const data = remoteMessage?.data || {};
// //   const receivedAt = new Date().toISOString();
// //   return { id, title, body, data, receivedAt };
// // }

// // useEffect(() => {
// //   // Foreground
// //   const unsubOnMessage = messaging().onMessage(async (remoteMessage) => {
// //     const item = toItem(remoteMessage);
// //     await addNotification(item);
// //     Alert.alert(item.title, item.body); // optional in-app alert
// //   });

// //   // Opened from background
// //   const unsubOpened = messaging().onNotificationOpenedApp(async (remoteMessage) => {
// //     if (remoteMessage) {
// //       const item = toItem(remoteMessage);
// //       await addNotification(item);
// //       handleNavigationFromMessage(remoteMessage.data);
// //     }
// //   });

// //   // Opened from quit (cold start)
// //   messaging().getInitialNotification().then(async (remoteMessage) => {
// //     if (remoteMessage) {
// //       const item = toItem(remoteMessage);
// //       await addNotification(item);
// //       handleNavigationFromMessage(remoteMessage.data);
// //     }
// //   });

// //   return () => {
// //     unsubOnMessage();
// //     unsubOpened();
// //   };
// // }, []);

// // // --- Subscribe user to topics ---
// // export async function initNotifications(selectedCourseId?: string) {
// //   // iOS permission; on Android 13+ also needed due to POST_NOTIFICATIONS
// //   await messaging().requestPermission();

// //   // Optional: prompt for exact Android 13 permission (some devices require explicit)
// //   if (Platform.OS === 'android') {
// //     // nothing else here; just ensure <uses-permission android:name="android.permission.POST_NOTIFICATIONS" /> in AndroidManifest.xml
// //   }

// //   await messaging().subscribeToTopic('allUsers');
// //   if (selectedCourseId) {
// //     await messaging().subscribeToTopic(`course_${selectedCourseId.toLowerCase()}`);
// //   }
// // }

// // // --- Background handler (must be in JS entry and early) ---
// // messaging().setBackgroundMessageHandler(async remoteMessage => {
// //   // You can do lightweight processing here if needed
// //   // console.log('BG message:', remoteMessage);
// // });

// // const Stack = createNativeStackNavigator();

// // export default function App() {
// //   const navRef = useRef<NavigationContainerRef<any>>(null);

// //   useEffect(() => {
// //     // TODO: replace with real user/course context if available
// //     const selectedCourseId = undefined; // e.g., read from async storage or user profile
// //     initNotifications(selectedCourseId);

// //     // 1) Foreground messages (app open)
// //     const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
// //       const title = remoteMessage.notification?.title ?? 'New update';
// //       const body = remoteMessage.notification?.body ?? 'You have a new notification.';
// //       Alert.alert(title, body);
// //     });

// //     // 2) Taps when app was in background
// //     const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
// //       handleNavigationFromMessage(remoteMessage?.data);
// //     });

// //     // 3) Taps when app was quit (cold start)
// //     messaging()
// //       .getInitialNotification()
// //       .then(remoteMessage => {
// //         if (remoteMessage) {
// //           handleNavigationFromMessage(remoteMessage.data);
// //         }
// //       });

// //     return () => {
// //       unsubscribeOnMessage();
// //       unsubscribeOpened();
// //     };
// //   }, []);

// //   // Navigate based on message data payload
// //   const handleNavigationFromMessage = (data?: Record<string, string>) => {
// //     if (!data || !navRef.current) return;

// //     // We’ll support a few simple intents:
// //     // data = { type: 'video', title: 'Heart', url: 'https://...', path: '...', screen: 'VideoPlayer' }
// //     // or { type: 'contact', screen: 'Contact' }
// //     const screen = data.screen || data.type; // allow either key
// //     switch (screen) {
// //       case 'VideoPlayer':
// //       case 'video':
// //         navRef.current.navigate('VideoPlayer', {
// //           title: data.title || 'Video',
// //           url: data.url,
// //           path: data.path,
// //         });
// //         break;

// //       case 'Explorer':
// //       case 'explorer':
// //         navRef.current.navigate('Explorer', {
// //           title: data.title || 'Explorer',
// //           path: data.path,
// //         });
// //         break;

// //       case 'Contact':
// //       case 'contact':
// //         navRef.current.navigate('Contact');
// //         break;

// //       case 'CourseDetails':
// //       case 'course':
// //         navRef.current.navigate('CourseDetails', {
// //           courseId: data.courseId,
// //           title: data.title || 'Course',
// //         });
// //         break;

// //       default:
// //         // Fallback: just go Home
// //         navRef.current.navigate('Home');
// //     }
// //   };

// //   return (
// //     <NavigationContainer ref={navRef}>
// //       <Stack.Navigator>
// //         {/* Auth */}
// //         <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
// //         <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />

// //         {/* Main */}
// //         <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
// //         <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />

// //         <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact Us' }} />
// //         <Stack.Screen
// //           name="Explorer"
// //           component={ExplorerScreen}
// //           options={({ route }) => ({ title: route.params?.title || 'Explorer' })}
// //         />
// //         <Stack.Screen
// //           name="Viewer"
// //           component={ViewerScreen}
// //           options={({ route }) => ({ title: route.params?.title || 'Viewer' })}
// //         />
// //         <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: 'Video' }} />
// //         <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Course' }} />
// //       </Stack.Navigator>
// //     </NavigationContainer>
// //   );
// // }













// // App.tsx
// // import React, { useEffect, useRef } from 'react';
// // import { Alert, Platform, PermissionsAndroid } from 'react-native';
// // import {
// //   NavigationContainer,
// //   NavigationContainerRef,
// // } from '@react-navigation/native';
// // import { createNativeStackNavigator } from '@react-navigation/native-stack';

// // import notifee, { EventType } from '@notifee/react-native';
// // import messaging from '@react-native-firebase/messaging';

// // import LoginScreen from './src/screens/LoginScreen';
// // import SignupScreen from './src/screens/SignupScreen';
// // import HomeScreen from './src/screens/HomeScreen';
// // import ContactScreen from './src/screens/ContactScreen';
// // import ExplorerScreen from './src/screens/ExplorerScreen';
// // import ViewerScreen from './src/screens/ViewerScreen';
// // import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
// // import CourseDetailsScreen from './src/screens/CourseDetailsScreen';
// // import NotificationsScreen from './src/screens/NotificationsScreen';

// // import { addNotification } from './src/utils/notificationsStorage';
// // import { startLocalVideoWatcher } from './src/utils/localVideoWatcher';

// // const Stack = createNativeStackNavigator();

// // // --- FCM init (permission + topics) ---
// // async function initNotifications(selectedCourseId?: string) {
// //   try {
// //     if (Platform.OS === 'android' && Platform.Version >= 33) {
// //       await PermissionsAndroid.request(
// //         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
// //       );
// //     }

// //     await messaging().requestPermission().catch(() => { });
// //     await messaging().subscribeToTopic('all');
// //     console.log('✅ Subscribed to topic: all');

// //     if (selectedCourseId) {
// //       const topic = `course_${String(selectedCourseId).toLowerCase()}`;
// //       await messaging().subscribeToTopic(topic);
// //       console.log('✅ Subscribed to topic:', topic);
// //     }

// //     const token = await messaging().getToken();
// //     console.log('🔑 FCM token:', token);
// //   } catch (e) {
// //     console.log('initNotifications error', e);
// //   }
// // }

// // // --- Normalize FCM message for local list ---
// // function toItem(remoteMessage: any) {
// //   const id = remoteMessage?.messageId || `${Date.now()}_${Math.random()}`;
// //   const n = remoteMessage?.notification || {};
// //   const d = remoteMessage?.data || {};
// //   const title = n.title || d.title || 'Update';
// //   const body = n.body || d.body || '';
// //   const receivedAt = Date.now();
// //   return { id, title, body, data: d, receivedAt };
// // }

// // export default function App() {
// //   const navRef = useRef<NavigationContainerRef<any>>(null);

// //   // --- Navigate based on payload (supports data.screen & data.type) ---
// //   const handleNavigationFromMessage = (data?: Record<string, string>) => {
// //     if (!data || !navRef.current) return;

// //     const screen = (data.screen || data.type || '').toLowerCase();
// //     const bestUrl = data.url || data.embedUrl || data.videoUrl;

// //     switch (screen) {
// //       case 'video':
// //       case 'videoplayer':
// //         // Route videos to Viewer (handles direct URLs & embeds)
// //         navRef.current.navigate('Viewer', {
// //           title: data.title || 'Video',
// //           type: 'video',
// //           url: bestUrl,
// //           embedUrl: data.embedUrl,
// //           nodeId: data.nodeId,
// //         });
// //         break;

// //       case 'explorer':
// //         navRef.current.navigate('Explorer', {
// //           title: data.title || 'Explorer',
// //           path: data.path,
// //         });
// //         break;

// //       case 'contact':
// //         navRef.current.navigate('Contact');
// //         break;

// //       case 'coursedetails':
// //       case 'course':
// //         navRef.current.navigate('CourseDetails', {
// //           courseId: data.courseId,
// //           title: data.title || 'Course',
// //         });
// //         break;

// //       default:
// //         navRef.current.navigate('Home');
// //         break;
// //     }
// //   };

// //   useEffect(() => {
// //     let unsubscribeWatcher: undefined | (() => void);
// //     let unsubscribeOnMessage: undefined | (() => void);
// //     let unsubscribeOpened: undefined | (() => void);

// //     (async () => {
// //       // 1) FCM init (permission + topics)
// //       await initNotifications(undefined);

// //       // 2) Start local Firestore watcher ONCE (Notifee local notifications)
// //       unsubscribeWatcher = await startLocalVideoWatcher();

// //       // 3) FCM (foreground)
// //       unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
// //         const item = toItem(remoteMessage);
// //         await addNotification(item);
// //         Alert.alert(item.title, item.body);
// //       });

// //       // 4) FCM (background → app opened by tap)
// //       unsubscribeOpened = messaging().onNotificationOpenedApp(async (remoteMessage) => {
// //         if (remoteMessage?.data) handleNavigationFromMessage(remoteMessage.data);
// //       });

// //       // FCM quit → app launched by push
// //       const initialFCM = await messaging().getInitialNotification();
// //       if (initialFCM?.data) handleNavigationFromMessage(initialFCM.data);

// //       // 🔑 Notifee local: foreground tap
// //       notifee.onForegroundEvent(async ({ type, detail }) => {
// //         if (type === EventType.PRESS) {
// //           handleNavigationFromMessage(detail.notification?.data as any);
// //         }
// //       });

// //       // Notifee local: app launched by tap (cold start)
// //       const initialNotifee = await notifee.getInitialNotification();
// //       if (initialNotifee?.type === EventType.PRESS) {
// //         handleNavigationFromMessage(initialNotifee.notification?.data as any);
// //       }
// //     })();

// //     return () => {
// //       unsubscribeWatcher?.();
// //       unsubscribeOnMessage?.();
// //       unsubscribeOpened?.();
// //     };
// //   }, []);

// //   return (
// //     <NavigationContainer ref={navRef}>
// //       <Stack.Navigator>
// //         {/* Auth */}
// //         <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
// //         <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />

// //         {/* Main */}
// //         <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
// //         <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
// //         <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact Us' }} />
// //         <Stack.Screen
// //           name="Explorer"
// //           component={ExplorerScreen}
// //           options={({ route }) => ({ title: (route as any).params?.title || 'Explorer' })}
// //         />
// //         <Stack.Screen
// //           name="Viewer"
// //           component={ViewerScreen}
// //           options={({ route }) => ({ title: (route as any).params?.title || 'Viewer' })}
// //         />
// //         <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: 'Video' }} />
// //         <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Course' }} />
// //       </Stack.Navigator>
// //     </NavigationContainer>
// //   );
// // }

// // App.tsx
// // App.tsx
// import React, { useEffect } from 'react';
// import { Alert, Platform, PermissionsAndroid } from 'react-native';
// import notifee, { EventType } from '@notifee/react-native';
// import messaging from '@react-native-firebase/messaging';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { ensureDefaultChannel } from './src/utils/notifyInit';
// import { navigationRef, go } from './src/navigation/navRef';

// // Screens
// import LoginScreen from './src/screens/LoginScreen';
// import SignupScreen from './src/screens/SignupScreen';
// import HomeScreen from './src/screens/HomeScreen';
// import ContactScreen from './src/screens/ContactScreen';
// import ExplorerScreen from './src/screens/ExplorerScreen';
// import ViewerScreen from './src/screens/ViewerScreen';
// import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
// import CourseDetailsScreen from './src/screens/CourseDetailsScreen';
// import NotificationsScreen from './src/screens/NotificationsScreen';
// import AIScreen from './src/screens/AIScreen';

// // Utilities
// import { addNotification } from './src/utils/notificationsStorage';
// import { startLocalVideoWatcher } from './src/utils/localVideoWatcher';
// import { subscribeAllTopic } from './src/utils/pushTopics';

// const Stack = createNativeStackNavigator();

// async function initNotifications(selectedCourseId?: string) {
//   try {
//     if (Platform.OS === 'android' && Platform.Version >= 33) {
//       await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//       );
//     }
//     await messaging().requestPermission().catch(() => { });
//     await messaging().subscribeToTopic('all');
//     console.log('✅ Subscribed to topic: all');

//     if (selectedCourseId) {
//       const topic = `course_${String(selectedCourseId).toLowerCase()}`;
//       await messaging().subscribeToTopic(topic);
//       console.log('✅ Subscribed to topic:', topic);
//     }

//     const token = await messaging().getToken();
//     console.log('🔑 FCM token:', token);
//   } catch (e) {
//     console.log('initNotifications error', e);
//   }
// }

// function toItem(remoteMessage: any) {
//   const id = remoteMessage?.messageId || `${Date.now()}_${Math.random()}`;
//   const n = remoteMessage?.notification || {};
//   const d = remoteMessage?.data || {};
//   const title = n.title || d.title || 'Update';
//   const body = n.body || d.body || '';
//   const receivedAt = Date.now();
//   return { id, title, body, data: d, receivedAt };
// }
// export default function App() {
//   const handleNavigationFromMessage = (data?: Record<string, string>) => {
//     if (!data) return;
//     const screen = (data.screen || data.type || '').toLowerCase();
//     const bestUrl = data.url || data.embedUrl || data.videoUrl;

//     switch (screen) {
//       case 'video':
//       case 'videoplayer':
//       case 'viewer':
//         go('Viewer', { title: data.title || 'Video', type: 'video', url: bestUrl, embedUrl: data.embedUrl, nodeId: data.nodeId });
//         break;
//       case 'notifications':
//       case 'notificationsscreen':
//         go('Notifications');
//         break;
//       case 'explorer':
//         go('Explorer', { title: data.title || 'Explorer', path: data.path });
//         break;
//       case 'contact':
//         go('Contact');
//         break;
//       case 'course':
//       case 'coursedetails':
//         go('CourseDetails', { courseId: data.courseId, title: data.title || 'Course' });
//         break;
//       default:
//         go('Home');
//     }
//   };

//   useEffect(() => {
//     let unsubscribeWatcher: undefined | (() => void);
//     let unsubscribeOnMessage: undefined | (() => void);
//     let unsubscribeOpened: undefined | (() => void);
//     let unsubscribeForegroundNotifee: undefined | (() => void);

//     ensureDefaultChannel();

//     // Foreground tap on local/FCM banners
//     const sub = notifee.onForegroundEvent(({ type, detail }) => {
//       if (type === EventType.PRESS) {
//         const nav = detail.notification?.data?.nav;
//         if (nav === 'Notifications') go('Notifications');
//         else handleNavigationFromMessage(detail.notification?.data as any);
//       }
//     });

//     // App launched by tapping a Notifee banner
//     (async () => {
//       const initial = await notifee.getInitialNotification();
//       if (initial?.notification?.data?.nav === 'Notifications') {
//         const t = setInterval(() => {
//           if (navigationRef.isReady()) {
//             go('Notifications');
//             clearInterval(t);
//           }
//         }, 100);
//         setTimeout(() => clearInterval(t), 4000);
//       }
//     })();

//     // init FCM
//     (async () => {
//       await initNotifications(undefined);
//       unsubscribeWatcher = await startLocalVideoWatcher();

//       // FCM in foreground
//       unsubscribeOnMessage = messaging().onMessage(async (rm) => {
//         const item = toItem(rm);
//         await addNotification(item);
//         Alert.alert(item.title, item.body);
//       });

//       // FCM background tap
//       unsubscribeOpened = messaging().onNotificationOpenedApp(async (rm) => {
//         if (rm?.data) handleNavigationFromMessage(rm.data);
//       });

//       // FCM cold start
//       const initialFCM = await messaging().getInitialNotification();
//       if (initialFCM?.data) handleNavigationFromMessage(initialFCM.data);

//       // Notifee cold start (local)
//       const initialNotifee = await notifee.getInitialNotification();
//       if (initialNotifee && initialNotifee.type === EventType.PRESS) {
//         handleNavigationFromMessage(initialNotifee.notification?.data as any);
//       }
//     })();

//     return () => {
//       sub();
//       unsubscribeWatcher?.();
//       unsubscribeOnMessage?.();
//       unsubscribeOpened?.();
//       unsubscribeForegroundNotifee?.();
//     };
//   }, []);

//   return (
//     <NavigationContainer ref={navigationRef}>
//       <Stack.Navigator
//         screenOptions={{
//           headerStyle: { backgroundColor: '#195ed2' },
//           headerTintColor: '#fff',
//           headerTitleStyle: { fontWeight: '700' },
//           headerTitleAlign: 'left',
//           headerShadowVisible: false,
//         }}
//       >
//         {/* screens unchanged */}
//         <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
//         <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
//         <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
//         <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
//         <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact Us' }} />
//         <Stack.Screen name="AI" component={AIScreen} options={{ title: 'AI Assistant' }} />
//         <Stack.Screen name="Explorer" component={ExplorerScreen} options={({ route }) => ({ title: (route as any).params?.title || 'Explorer' })} />
//         <Stack.Screen name="Viewer" component={ViewerScreen} options={({ route }) => ({ title: (route as any).params?.title || 'Viewer' })} />
//         <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: 'Video' }} />
//         <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Course' }} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// App.tsx
import React, { useEffect } from 'react';
import { Platform, StatusBar, PermissionsAndroid, Dimensions, Alert } from 'react-native';
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
import { startLocalVideoWatcher } from './src/utils/localVideoWatcher';
import { addNotification } from './src/utils/notificationsStorage';

const Stack = createNativeStackNavigator();

async function initNotifications(selectedCourseId?: string) {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    await messaging().requestPermission().catch(() => { });
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

function toItem(remoteMessage: any) {
  const id = remoteMessage?.messageId || `${Date.now()}_${Math.random()}`;
  const n = remoteMessage?.notification || {};
  const d = remoteMessage?.data || {};
  const title = n.title || d.title || 'Update';
  const body = n.body || d.body || '';
  const receivedAt = Date.now();
  return { id, title, body, data: d, receivedAt };
}

function RootNavigator() {
  const { width } = Dimensions.get('window');
  const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

  const handleNavigationFromMessage = (data?: Record<string, string>) => {
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
  };

  useEffect(() => {
    let unsubscribeWatcher: undefined | (() => void);
    let unsubscribeOnMessage: undefined | (() => void);
    let unsubscribeOpened: undefined | (() => void);

    ensureDefaultChannel();


    const sub = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const nav = detail.notification?.data?.nav;
        if (nav === 'Notifications') go('Notifications');
        else handleNavigationFromMessage(detail.notification?.data as any);
      }
    });


    (async () => {
      const initial = await notifee.getInitialNotification();
      if (initial?.notification?.data?.nav === 'Notifications') {
        const t = setInterval(() => {
          if (navigationRef.isReady()) {
            go('Notifications');
            clearInterval(t);
          }
        }, 100);
        setTimeout(() => clearInterval(t), 4000);
      }
    })();


    (async () => {
      await initNotifications(undefined);
      unsubscribeWatcher = await startLocalVideoWatcher();


      unsubscribeOnMessage = messaging().onMessage(async (rm) => {
        const item = toItem(rm);
        await addNotification(item);
        Alert.alert(item.title, item.body);
      });


      unsubscribeOpened = messaging().onNotificationOpenedApp(async (rm) => {
        if (rm?.data) handleNavigationFromMessage(rm.data);
      });


      const initialFCM = await messaging().getInitialNotification();
      if (initialFCM?.data) handleNavigationFromMessage(initialFCM.data);
    })();

    return () => {
      sub();
      unsubscribeWatcher?.();
      unsubscribeOnMessage?.();
      unsubscribeOpened?.();
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
