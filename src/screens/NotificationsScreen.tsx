// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { getNotifications, clearNotifications } from '../utils/notificationsStorage';

// export default function NotificationsScreen({ navigation }) {
//     const [items, setItems] = useState([]);
//     const [refreshing, setRefreshing] = useState(false);

//     const load = useCallback(async () => {
//         setRefreshing(true);
//         const list = await getNotifications();
//         setItems(list);
//         setRefreshing(false);
//     }, []);

//     useEffect(() => { load(); }, [load]);

//     const renderItem = ({ item }) => (
//         <TouchableOpacity style={styles.card} activeOpacity={0.8}
//             onPress={() => {
//                 // Optional: deep-link based on item.data
//                 const screen = item?.data?.screen || item?.data?.type;
//                 navigation.navigate(screen === 'video' || screen === 'VideoPlayer' ? 'VideoPlayer' : 'Home', {
//                     title: item?.data?.title || item.title,
//                     url: item?.data?.url,
//                     path: item?.data?.path,
//                     courseId: item?.data?.courseId,
//                 });
//             }}>
//             <View style={styles.row}>
//                 <Icon name="bell-ring" size={22} color="#166534" />
//                 <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
//             </View>
//             <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
//             <Text style={styles.time}>{new Date(item.receivedAt).toLocaleString()}</Text>
//         </TouchableOpacity>
//     );

//     return (
//         <View style={styles.container}>
//             {/* Header */}
//             <View style={styles.header}>
//                 {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
//                     <Icon name="arrow-left" size={24} color="#0f172a" />
//                 </TouchableOpacity>
//                 <Text style={styles.headerTitle}>Notifications</Text> */}
//                 <TouchableOpacity
//                     onPress={async () => {
//                         await clearNotifications();
//                         load();
//                     }}
//                     style={styles.clearButton}
//                 >
//                     <Icon name="delete-outline" size={22} color="#ef4444" />
//                 </TouchableOpacity>

//             </View>

//             <FlatList
//                 data={items}
//                 keyExtractor={(it) => it.id}
//                 renderItem={renderItem}
//                 contentContainerStyle={{ padding: 16 }}
//                 refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
//                 ListEmptyComponent={
//                     <View style={{ padding: 24, alignItems: 'center' }}>
//                         <Icon name="bell-off" size={28} color="#9ca3af" />
//                         <Text style={{ marginTop: 8, color: '#6b7280' }}>No notifications yet</Text>
//                     </View>
//                 }
//             />
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#f8fafc' },
//     header: {
//         paddingHorizontal: 12, paddingVertical: 12,
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//     },
//     back: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
//     headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
//     clearText: { color: '#ef4444', fontWeight: '700' },

//     card: {
//         backgroundColor: '#fff', borderRadius: 14, padding: 14,
//         borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12,
//     },
//     row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
//     title: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
//     body: { color: '#374151', marginBottom: 6 },
//     time: { fontSize: 12, color: '#6b7280' },
// });


// //src/NotificationsScreen.js
// import React, { useEffect, useState, useCallback, useRef } from 'react';
// import {
//     View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { useFocusEffect } from '@react-navigation/native';
// import firestore from '@react-native-firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import notifee, { AndroidImportance } from '@notifee/react-native';

// import { getNotifications, clearNotifications } from '../utils/notificationsStorage';
// import { ensureDefaultChannel } from '../utils/notifyInit';
// // ============================
// // Helpers
// // ============================
// const SEEN_KEY = 'announcements_seen_v1';

// async function getSeenIds() {
//     try {
//         const s = await AsyncStorage.getItem(SEEN_KEY);
//         return s ? JSON.parse(s) : {};
//     } catch { return {}; }
// }
// async function setSeenIds(map) {
//     try { await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(map)); } catch { }
// }

// function formatWhen(when) {
//     try {
//         if (when && typeof when === 'object') {
//             if (typeof when.toDate === 'function') return when.toDate().toLocaleString();
//             if (Number.isFinite(when.seconds)) return new Date(when.seconds * 1000).toLocaleString();
//         }
//         if (Number.isFinite(when)) return new Date(when).toLocaleString();
//         const d = new Date(when);
//         if (!isNaN(d.getTime())) return d.toLocaleString();
//     } catch { }
//     return '';
// }

// function makeKey(n) {
//     if (n.__origin === 'announcement' && n.id) return n.id; // stable
//     const parts = [n.id, n?.data?.id, n?.title, n.__origin].filter(Boolean);
//     return parts.join('|') || Math.random().toString(36).slice(2);
// }

// function normalizeNotification(n) {
//     const title = n?.title || n?.data?.title || 'Notification';
//     const body = n?.body || n?.data?.body || '';
//     const when = n?.receivedAt ?? n?.createdAt ?? n?.time;
//     return {
//         ...n,
//         title,
//         body,
//         receivedAt: when,
//         __origin: n.__origin || 'local',
//         __key: makeKey(n),
//     };
// }

// function announcementToNotif(doc) {
//     const d = doc.data() || {};
//     const title = d.title || 'Announcement';
//     const body = d.body || '';
//     const createdAt = d.createdAt || Date.now();
//     const data = { ...(d.data || {}), title, type: 'announcement' };
//     return normalizeNotification({
//         id: doc.id,
//         title,
//         body,
//         receivedAt: createdAt,
//         data,
//         __origin: 'announcement',
//     });
// }

// // ============================
// // Main Screen
// // ============================
// export default function NotificationsScreen({ navigation }) {
//     const [localItems, setLocalItems] = useState([]);
//     const [announcements, setAnnouncements] = useState([]);
//     const [refreshing, setRefreshing] = useState(false);
//     const annUnsubRef = useRef(null);

//     // ---------- Merge ----------
//     const mergedItems = [...announcements, ...localItems].sort((a, b) => {
//         const ta = a.receivedAt?.seconds ? a.receivedAt.seconds * 1000 : new Date(a.receivedAt || 0).getTime();
//         const tb = b.receivedAt?.seconds ? b.receivedAt.seconds * 1000 : new Date(b.receivedAt || 0).getTime();
//         return tb - ta;
//     });

//     // ---------- Local ----------
//     const loadLocal = useCallback(async () => {
//         const list = await getNotifications();
//         const normalized = (Array.isArray(list) ? list : []).map(n =>
//             normalizeNotification({ ...n, __origin: 'local' })
//         );
//         setLocalItems(normalized);
//     }, []);

//     // ---------- Announcements (live) ----------
//     const startAnnouncementsListener = useCallback(() => {
//         const q = firestore()
//             .collection('announcements')
//             .where('published', '==', true)
//             .limit(100);

//         let known = {}; // track “published” we’ve already notified to also catch modified→published

//         const unsub = q.onSnapshot(async (snap) => {
//             const anns = snap.docs.map(announcementToNotif);

//             await ensureDefaultChannel();
//             const seen = await getSeenIds();

//             // fire for ADDED, and for MODIFIED that become published (we only see published==true here)
//             for (const change of snap.docChanges()) {
//                 const id = change.doc.id;
//                 const data = change.doc.data() || {};

//                 const isAdded = change.type === 'added';
//                 const isModified = change.type === 'modified';

//                 if ((isAdded || isModified) && data.published === true) {
//                     // dedupe by seen + known map
//                     if (!seen[id] && !known[id]) {
//                         await notifee.displayNotification({
//                             title: data.title || 'Announcement',
//                             body: data.body || '',
//                             android: {
//                                 channelId: 'default',
//                                 smallIcon: 'ic_launcher',
//                                 importance: AndroidImportance.HIGH,
//                                 pressAction: { id: 'open-notifications' },
//                             },
//                             data: { nav: 'Notifications' }, // tapping opens Notifications screen
//                         });
//                         seen[id] = 1;
//                         known[id] = 1;
//                     }
//                 }
//             }

//             await setSeenIds(seen);

//             anns.sort((a, b) => {
//                 const ta = a.receivedAt?.seconds ? a.receivedAt.seconds * 1000 : new Date(a.receivedAt || 0).getTime();
//                 const tb = b.receivedAt?.seconds ? b.receivedAt.seconds * 1000 : new Date(b.receivedAt || 0).getTime();
//                 return tb - ta;
//             });

//             setAnnouncements(anns);
//         });

//         return unsub;
//     }, []);

//     // ---------- Mount ----------
//     useEffect(() => {
//         loadLocal();
//         const unsub = startAnnouncementsListener();
//         annUnsubRef.current = unsub;
//         return () => { try { annUnsubRef.current && annUnsubRef.current(); } catch { } };
//     }, [loadLocal, startAnnouncementsListener]);

//     // ---------- Pull to Refresh ----------
//     const onRefresh = async () => {
//         setRefreshing(true);
//         await loadLocal(); // local only
//         setRefreshing(false);
//     };

//     // ---------- Refocus ----------
//     useFocusEffect(useCallback(() => { loadLocal(); }, [loadLocal]));

//     // ---------- Tap handler ----------
//     const handleOpen = (item) => {
//         if (item.__origin === 'announcement') return; // do nothing for announcements

//         const type = (item?.data?.type || item?.data?.screen || '').toLowerCase();
//         const title = item?.data?.title || item.title || 'Video';
//         const nodeId = item?.data?.nodeId;
//         const url = item?.data?.url || '';
//         const embed = item?.data?.embedUrl || item?.data?.videoUrl || '';
//         const path = item?.data?.path;
//         const courseId = item?.data?.courseId;
//         const bestUrl = url || embed;
//         const isPdf = (bestUrl || '').toLowerCase().endsWith('.pdf');

//         if (type === 'video' || type === 'videoplayer') {
//             if (bestUrl) {
//                 navigation.navigate('Viewer', { title, type: 'video', url: bestUrl, embedUrl: embed || undefined, nodeId });
//             } else if (nodeId) {
//                 navigation.navigate('Viewer', { title, type: 'video', nodeId });
//             } else {
//                 navigation.navigate('Home');
//             }
//             return;
//         }

//         if (type === 'pdf' || isPdf) {
//             navigation.navigate('Viewer', { title, type: 'pdf', url: bestUrl || url, nodeId });
//             return;
//         }

//         if (type === 'folder' || type === 'explorer') {
//             if (nodeId) {
//                 navigation.navigate('Explorer', { openFolderId: nodeId, openFolderName: title });
//             } else {
//                 navigation.navigate('Explorer', { path, courseId });
//             }
//             return;
//         }

//         navigation.navigate('Home');
//     };

//     // ---------- Render ----------
//     const renderItem = ({ item }) => (
//         <TouchableOpacity
//             style={styles.card}
//             activeOpacity={item.__origin === 'announcement' ? 1 : 0.8}
//             onPress={() => handleOpen(item)}
//         >
//             <View style={styles.row}>
//                 <Icon
//                     name={item.__origin === 'announcement' ? 'bullhorn' : 'bell-ring'}
//                     size={22}
//                     color={item.__origin === 'announcement' ? '#b91c1c' : '#166534'}
//                 />
//                 <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
//             </View>
//             {!!item.body && <Text style={styles.body} numberOfLines={2}>{item.body}</Text>}
//             <Text style={styles.time}>{formatWhen(item.receivedAt)}</Text>
//         </TouchableOpacity>
//     );

//     return (
//         <View style={styles.container}>
//             <View style={styles.header}>
//                 <TouchableOpacity
//                     onPress={async () => {
//                         await clearNotifications(); // clears local (video) items
//                         await loadLocal();
//                     }}
//                     style={styles.clearButton}
//                 >
//                     <Icon name="delete-outline" size={22} color="#ef4444" />
//                 </TouchableOpacity>
//             </View>

//             <FlatList
//                 data={mergedItems}
//                 keyExtractor={(it) => it.__key}
//                 renderItem={renderItem}
//                 contentContainerStyle={{ padding: 16 }}
//                 refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//                 ListEmptyComponent={
//                     <View style={{ padding: 24, alignItems: 'center' }}>
//                         <Icon name="bell-off" size={28} color="#9ca3af" />
//                         <Text style={{ marginTop: 8, color: '#6b7280' }}>No notifications yet</Text>
//                     </View>
//                 }
//             />
//         </View>
//     );
// }

// // ============================
// // Styles
// // ============================
// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#f8fafc' },
//     header: {
//         paddingHorizontal: 12, paddingVertical: 12,
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
//     },
//     clearButton: { padding: 6 },
//     card: {
//         backgroundColor: '#fff', borderRadius: 14, padding: 14,
//         borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12,
//     },
//     row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
//     title: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
//     body: { color: '#374151', marginBottom: 6 },
//     time: { fontSize: 12, color: '#6b7280' },
// });
// src/screens/NotificationsScreen.tsx
import React, {
    useEffect, useState, useCallback, useRef, useLayoutEffect
} from 'react';
import {
    View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

import { getNotifications, clearNotifications } from '../utils/notificationsStorage';
import { ensureDefaultChannel } from '../utils/notifyInit';

// --- helpers (unchanged) ---
const SEEN_KEY = 'announcements_seen_v1';
async function getSeenIds() { try { const s = await AsyncStorage.getItem(SEEN_KEY); return s ? JSON.parse(s) : {}; } catch { return {}; } }
async function setSeenIds(map: any) { try { await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(map)); } catch { } }
function formatWhen(when: any) { try { if (when && typeof when === 'object') { if (typeof when.toDate === 'function') return when.toDate().toLocaleString(); if (Number.isFinite(when.seconds)) return new Date(when.seconds * 1000).toLocaleString(); } if (Number.isFinite(when)) return new Date(when).toLocaleString(); const d = new Date(when); if (!isNaN(d.getTime())) return d.toLocaleString(); } catch { } return ''; }
function makeKey(n: any) { if (n.__origin === 'announcement' && n.id) return n.id; const parts = [n.id, n?.data?.id, n?.title, n.__origin].filter(Boolean); return parts.join('|') || Math.random().toString(36).slice(2); }
function normalizeNotification(n: any) { const title = n?.title || n?.data?.title || 'Notification'; const body = n?.body || n?.data?.body || ''; const when = n?.receivedAt ?? n?.createdAt ?? n?.time; return { ...n, title, body, receivedAt: when, __origin: n.__origin || 'local', __key: makeKey(n) }; }
function announcementToNotif(doc: any) { const d = doc.data() || {}; const title = d.title || 'Announcement'; const body = d.body || ''; const createdAt = d.createdAt || Date.now(); const data = { ...(d.data || {}), title, type: 'announcement' }; return normalizeNotification({ id: doc.id, title, body, receivedAt: createdAt, data, __origin: 'announcement' }); }

export default function NotificationsScreen({ navigation }: any) {
    const [localItems, setLocalItems] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const annUnsubRef = useRef<null | (() => void)>(null);

    const { width } = Dimensions.get('window');
    const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

    // ---- Local first (define BEFORE onClear) ----
    const loadLocal = useCallback(async () => {
        const list = await getNotifications();
        const normalized = (Array.isArray(list) ? list : []).map((n) =>
            normalizeNotification({ ...n, __origin: 'local' })
        );
        setLocalItems(normalized);
    }, []);

    // Header button callback (depends on loadLocal)
    const onClear = useCallback(async () => {
        await clearNotifications();
        await loadLocal();
    }, [loadLocal]);

    // Merge lists
    const mergedItems = [...announcements, ...localItems].sort((a, b) => {
        const ta = a.receivedAt?.seconds ? a.receivedAt.seconds * 1000 : new Date(a.receivedAt || 0).getTime();
        const tb = b.receivedAt?.seconds ? b.receivedAt.seconds * 1000 : new Date(b.receivedAt || 0).getTime();
        return tb - ta;
    });

    // Live announcements
    const startAnnouncementsListener = useCallback(() => {
        const q = firestore().collection('announcements').where('published', '==', true).limit(100);
        let known: Record<string, 1> = {};
        const unsub = q.onSnapshot(async (snap) => {
            const anns = snap.docs.map(announcementToNotif);
            await ensureDefaultChannel();
            const seen = await getSeenIds();

            for (const change of snap.docChanges()) {
                const id = change.doc.id;
                const data = change.doc.data() || {};
                const isAdded = change.type === 'added';
                const isModified = change.type === 'modified';

                if ((isAdded || isModified) && data.published === true) {
                    if (!seen[id] && !known[id]) {
                        await notifee.displayNotification({
                            title: data.title || 'Announcement',
                            body: data.body || '',
                            android: {
                                channelId: 'default',
                                smallIcon: 'ic_launcher',
                                importance: AndroidImportance.HIGH,
                                pressAction: { id: 'open-notifications' },
                            },
                            data: { nav: 'Notifications' },
                        });
                        seen[id] = 1; known[id] = 1;
                    }
                }
            }
            await setSeenIds(seen);

            anns.sort((a, b) => {
                const ta = a.receivedAt?.seconds ? a.receivedAt.seconds * 1000 : new Date(a.receivedAt || 0).getTime();
                const tb = b.receivedAt?.seconds ? b.receivedAt.seconds * 1000 : new Date(b.receivedAt || 0).getTime();
                return tb - ta;
            });
            setAnnouncements(anns);
        });
        return unsub;
    }, []);

    // Mount
    useEffect(() => {
        loadLocal();
        const unsub = startAnnouncementsListener();
        annUnsubRef.current = unsub;
        return () => { try { annUnsubRef.current && annUnsubRef.current(); } catch { } };
    }, [loadLocal, startAnnouncementsListener]);

    // Pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await loadLocal();
        setRefreshing(false);
    };

    // Refocus refresh
    useFocusEffect(useCallback(() => { loadLocal(); }, [loadLocal]));

    // Put clear button in header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={onClear} style={{ paddingHorizontal: 12 }}>
                    <Icon name="delete-outline" size={22} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation, onClear]);

    // Tap handler (unchanged)
    const handleOpen = (item: any) => {
        if (item.__origin === 'announcement') return;
        const type = (item?.data?.type || item?.data?.screen || '').toLowerCase();
        const title = item?.data?.title || item.title || 'Video';
        const nodeId = item?.data?.nodeId;
        const url = item?.data?.url || '';
        const embed = item?.data?.embedUrl || item?.data?.videoUrl || '';
        const path = item?.data?.path;
        const courseId = item?.data?.courseId;
        const bestUrl = url || embed;
        const isPdf = (bestUrl || '').toLowerCase().endsWith('.pdf');

        if (type === 'video' || type === 'videoplayer') {
            if (bestUrl) navigation.navigate('Viewer', { title, type: 'video', url: bestUrl, embedUrl: embed || undefined, nodeId });
            else if (nodeId) navigation.navigate('Viewer', { title, type: 'video', nodeId });
            else navigation.navigate('Home');
            return;
        }
        if (type === 'pdf' || isPdf) { navigation.navigate('Viewer', { title, type: 'pdf', url: bestUrl || url, nodeId }); return; }
        if (type === 'folder' || type === 'explorer') {
            if (nodeId) navigation.navigate('Explorer', { openFolderId: nodeId, openFolderName: title });
            else navigation.navigate('Explorer', { path, courseId });
            return;
        }
        navigation.navigate('Home');
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.card, { padding: 14 * scale }]}
            activeOpacity={item.__origin === 'announcement' ? 1 : 0.8}
            onPress={() => handleOpen(item)}
        >
            <View style={styles.row}>
                <Icon
                    name={item.__origin === 'announcement' ? 'bullhorn' : 'bell-ring'}
                    size={22 * scale}
                    color={item.__origin === 'announcement' ? '#b91c1c' : '#166534'}
                />
                <Text style={[styles.title, { fontSize: 16 * scale }]} numberOfLines={1}>{item.title}</Text>
            </View>
            {!!item.body && <Text style={[styles.body, { fontSize: 14 * scale }]} numberOfLines={2}>{item.body}</Text>}
            <Text style={[styles.time, { fontSize: 12 * scale }]}>{formatWhen(item.receivedAt)}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* no custom header here; we use native headerRight */}
            <FlatList
                data={mergedItems}
                keyExtractor={(it: any) => it.__key}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={{ padding: 24, alignItems: 'center' }}>
                        <Icon name="bell-off" size={28 * scale} color="#9ca3af" />
                        <Text style={{ marginTop: 8, color: '#6b7280', fontSize: 14 * scale }}>No notifications yet</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    title: { fontWeight: '700', color: '#0f172a', flex: 1 },
    body: { color: '#374151', marginBottom: 6 },
    time: { color: '#6b7280' },
});
