// import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
// import {
//     View,
//     Text,
//     FlatList,
//     RefreshControl,
//     TouchableOpacity,
//     StyleSheet,
//     Dimensions,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { useFocusEffect } from '@react-navigation/native';
// import { getNotifications, clearNotifications } from '../utils/notificationsStorage';

// /* ---------- helpers ---------- */

// const asStr = (v: any): string =>
//     typeof v === 'string'
//         ? v
//         : v == null
//             ? ''
//             : typeof v === 'object'
//                 ? JSON.stringify(v)
//                 : String(v);

// function formatWhen(when: any) {
//     try {
//         if (when && typeof when === 'object') {
//             if (typeof when.toDate === 'function') return when.toDate().toLocaleString();
//             if (Number.isFinite((when as any).seconds)) {
//                 return new Date((when as any).seconds * 1000).toLocaleString();
//             }
//         }
//         if (Number.isFinite(when)) return new Date(when).toLocaleString();
//         const d = new Date(when);
//         if (!isNaN(d.getTime())) return d.toLocaleString();
//     } catch { }
//     return '';
// }

// function makeKey(n: any) {
//     const parts = [n.id, n?.data?.id, n?.title, n.__origin].filter(Boolean);
//     return parts.join('|') || Math.random().toString(36).slice(2);
// }

// function normalizeNotification(n: any) {
//     const title = asStr(n?.title || n?.data?.title || 'Notification');
//     const body = asStr(n?.body || n?.data?.body || '');
//     const when = n?.receivedAt ?? n?.createdAt ?? n?.time ?? Date.now();
//     return { ...n, title, body, receivedAt: when, __origin: n.__origin || 'push', __key: makeKey(n) };
// }

// /* ---------- component ---------- */

// export default function NotificationsScreen({ navigation }: any) {
//     const [items, setItems] = useState<any[]>([]);
//     const [refreshing, setRefreshing] = useState(false);

//     const { width } = Dimensions.get('window');
//     const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

//     const loadInbox = useCallback(async () => {
//         const list = await getNotifications();
//         const normalized = (Array.isArray(list) ? list : []).map(normalizeNotification);
//         normalized.sort((a, b) => {
//             const ta = a.receivedAt?.seconds ? a.receivedAt.seconds * 1000 : new Date(a.receivedAt || 0).getTime();
//             const tb = b.receivedAt?.seconds ? b.receivedAt.seconds * 1000 : new Date(b.receivedAt || 0).getTime();
//             return tb - ta;
//         });
//         setItems(normalized);
//     }, []);

//     useEffect(() => {
//         loadInbox();
//     }, [loadInbox]);

//     useFocusEffect(
//         useCallback(() => {
//             loadInbox();
//         }, [loadInbox])
//     );

//     const onClear = useCallback(async () => {
//         await clearNotifications();
//         await loadInbox();
//     }, [loadInbox]);

//     useLayoutEffect(() => {
//         navigation.setOptions({
//             headerRight: () => (
//                 <TouchableOpacity onPress={onClear} style={{ paddingHorizontal: 12 }}>
//                     <Icon name="delete-outline" size={22} color="#fff" />
//                 </TouchableOpacity>
//             ),
//         });
//     }, [navigation, onClear]);

//     // Open actions supporting announcements + video/pdf/folder deep-links
//     const handleOpen = (item: any) => {
//         const data = item?.data || {};
//         const type = (asStr(data.type) || asStr(data.screen)).toLowerCase();
//         const title = asStr(data.title) || item.title || 'Open';
//         const nodeId = asStr(data.nodeId);
//         const url = asStr(data.url || data.videoUrl || data.pdfUrl);

//         const isPdf = (url || '').toLowerCase().endsWith('.pdf');

//         // Explicit handling for announcements/inbox
//         if (type === 'announcement' || type === 'announcements' || type === 'notifications' || type === 'notificationsscreen') {
//             navigation.navigate('Notifications');
//             return;
//         }

//         if (type === 'video' || type === 'videoplayer') {
//             if (url) navigation.navigate('Viewer', { title, type: 'video', url, nodeId });
//             else if (nodeId) navigation.navigate('Viewer', { title, type: 'video', nodeId });
//             else navigation.navigate('Home');
//             return;
//         }

//         if (type === 'pdf' || isPdf) {
//             navigation.navigate('Viewer', { title, type: 'pdf', url, nodeId });
//             return;
//         }

//         if (type === 'folder' || type === 'explorer') {
//             if (nodeId) navigation.navigate('Explorer', { openFolderId: nodeId, openFolderName: title });
//             else navigation.navigate('Explorer');
//             return;
//         }

//         // Fallback
//         navigation.navigate('Home');
//     };

//     const onRefresh = async () => {
//         setRefreshing(true);
//         await loadInbox();
//         setRefreshing(false);
//     };

//     const renderItem = ({ item }: any) => (
//         <TouchableOpacity
//             style={[styles.card, { padding: 14 * scale }]}
//             activeOpacity={0.85}
//             onPress={() => handleOpen(item)}
//         >
//             <View style={styles.row}>
//                 <Icon name="bell-ring" size={22 * scale} color="#166534" />
//                 <Text style={[styles.title, { fontSize: 16 * scale }]} numberOfLines={1}>
//                     {item.title}
//                 </Text>
//             </View>
//             {!!item.body && (
//                 <Text style={[styles.body, { fontSize: 14 * scale }]} numberOfLines={2}>
//                     {item.body}
//                 </Text>
//             )}
//             <Text style={[styles.time, { fontSize: 12 * scale }]}>{formatWhen(item.receivedAt)}</Text>
//         </TouchableOpacity>
//     );

//     return (
//         <View style={styles.container}>
//             <FlatList
//                 data={items}
//                 keyExtractor={(it: any) => it.__key}
//                 renderItem={renderItem}
//                 contentContainerStyle={{ padding: 16 }}
//                 refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//                 ListEmptyComponent={
//                     <View style={{ padding: 24, alignItems: 'center' }}>
//                         <Icon name="bell-off" size={28 * scale} color="#9ca3af" />
//                         <Text style={{ marginTop: 8, color: '#6b7280', fontSize: 14 * scale }}>
//                             No notifications yet
//                         </Text>
//                     </View>
//                 }
//             />
//         </View>
//     );
// }

// /* ---------- styles ---------- */

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#f8fafc' },
//     card: {
//         backgroundColor: '#fff',
//         borderRadius: 14,
//         padding: 14,
//         borderWidth: 1,
//         borderColor: '#e5e7eb',
//         marginBottom: 12,
//     },
//     row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
//     title: { fontWeight: '700', color: '#0f172a', flex: 1 },
//     body: { color: '#374151', marginBottom: 6 },
//     time: { color: '#6b7280' },
// });
// src/screens/NotificationsScreen.tsx
// src/screens/NotificationsScreen.tsx
import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
    View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet,
    Dimensions, Modal, Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getNotifications, clearNotifications } from '../utils/notificationsStorage';

// ---- helpers ----
function formatWhen(when: any) {
    try {
        if (when && typeof when === 'object') {
            if (typeof when.toDate === 'function') return when.toDate().toLocaleString();
            if (Number.isFinite(when.seconds)) return new Date(when.seconds * 1000).toLocaleString();
        }
        if (Number.isFinite(when)) return new Date(when).toLocaleString();
        const d = new Date(when);
        if (!isNaN(d.getTime())) return d.toLocaleString();
    } catch { }
    return '';
}

function makeKey(n: any) {
    const parts = [n.id, n?.data?.id, n?.title, n.__origin].filter(Boolean);
    return parts.join('|') || Math.random().toString(36).slice(2);
}

function normalizeNotification(n: any) {
    const title = n?.title || n?.data?.title || 'Notification';
    const body = n?.body || n?.data?.body || '';
    const when = n?.receivedAt ?? n?.createdAt ?? n?.time ?? Date.now();
    return { ...n, title, body, receivedAt: when, __origin: n.__origin || 'push', __key: makeKey(n) };
}

// Kind detector + icon mapping
type Kind = 'info' | 'video' | 'pdf' | 'folder';

function kindFromItem(item: any): Kind {
    const d = item?.data || {};
    const type = String(d.type || d.screen || '').toLowerCase();
    const url = String(d.url || d.videoUrl || d.pdfUrl || '');
    const isPdf = url.endsWith('.pdf');

    if (type.includes('video')) return 'video';
    if (type === 'pdf' || isPdf) return 'pdf';
    if (type === 'folder' || type === 'explorer') return 'folder';
    // default for plain announcements
    return 'info';
}

function iconForKind(k: Kind): { name: string; color: string } {
    switch (k) {
        case 'video': return { name: 'play-circle', color: '#166534' }; // green
        case 'pdf': return { name: 'file-pdf-box', color: '#ef4444' }; // red
        case 'folder': return { name: 'folder-outline', color: '#f59e0b' }; // amber
        case 'info':
        default: return { name: 'bullhorn', color: '#195ed2' }; // blue
    }
}

export default function NotificationsScreen({ navigation }: any) {
    const [items, setItems] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state for plain announcements
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalBody, setModalBody] = useState('');
    const [modalKind, setModalKind] = useState<Kind>('info');

    const { width } = Dimensions.get('window');
    const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

    const loadInbox = useCallback(async () => {
        const list = await getNotifications();
        const normalized = (Array.isArray(list) ? list : []).map(normalizeNotification);
        normalized.sort((a, b) => {
            const ta = a.receivedAt?.seconds ? a.receivedAt.seconds * 1000 : new Date(a.receivedAt || 0).getTime();
            const tb = b.receivedAt?.seconds ? b.receivedAt.seconds * 1000 : new Date(b.receivedAt || 0).getTime();
            return tb - ta;
        });
        setItems(normalized);
    }, []);

    useEffect(() => { loadInbox(); }, [loadInbox]);
    useFocusEffect(useCallback(() => { loadInbox(); }, [loadInbox]));

    const onClear = useCallback(async () => {
        await clearNotifications();
        await loadInbox();
    }, [loadInbox]);

    // useLayoutEffect(() => {
    //     navigation.setOptions({
    //         headerRight: () => (
    //             <TouchableOpacity onPress={onClear} style={{ paddingHorizontal: 12 }}>
    //                 <Icon name="delete-outline" size={22} color="#fff" />
    //             </TouchableOpacity>
    //         ),
    //     });
    // }, [navigation, onClear]);

    // Open actions
    const handleOpen = (item: any) => {
        const data = item?.data || {};
        const type = (data.type || data.screen || '').toLowerCase();
        const title = data.title || item.title || 'Open';
        const nodeId = data.nodeId;
        const url = data.url || data.videoUrl || data.pdfUrl || '';
        const isPdf = (url || '').toLowerCase().endsWith('.pdf');

        // Tiny modal for announcements
        if (type === 'info' || type === 'announcement' || !type) {
            setModalTitle(title);
            setModalBody(item.body || data.body || '');
            setModalKind('info');
            setModalVisible(true);
            return;
        }

        // Deep links
        if (type === 'video' || type === 'videoplayer') {
            if (url) navigation.navigate('Viewer', { title, type: 'video', url, nodeId });
            else if (nodeId) navigation.navigate('Viewer', { title, type: 'video', nodeId });
            else navigation.navigate('Home');
            return;
        }

        if (type === 'pdf' || isPdf) {
            navigation.navigate('Viewer', { title, type: 'pdf', url, nodeId });
            return;
        }

        if (type === 'folder' || type === 'explorer') {
            if (nodeId) navigation.navigate('Explorer', { openFolderId: nodeId, openFolderName: title });
            else navigation.navigate('Explorer');
            return;
        }

        if (type === 'notifications' || type === 'notificationsscreen') {
            navigation.navigate('Notifications');
            return;
        }

        navigation.navigate('Home');
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadInbox();
        setRefreshing(false);
    };

    const renderItem = ({ item }: any) => {
        const kind = kindFromItem(item);
        const { name, color } = iconForKind(kind);

        return (
            <TouchableOpacity
                style={[styles.card, { padding: 14 * scale }]}
                activeOpacity={0.85}
                onPress={() => handleOpen(item)}
            >
                <View style={styles.row}>
                    <Icon name={name} size={22 * scale} color={color} />
                    <Text style={[styles.title, { fontSize: 16 * scale }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                </View>
                {!!item.body && (
                    <Text style={[styles.body, { fontSize: 14 * scale }]} numberOfLines={2}>
                        {item.body}
                    </Text>
                )}
                <Text style={[styles.time, { fontSize: 12 * scale }]}>{formatWhen(item.receivedAt)}</Text>
            </TouchableOpacity>
        );
    };

    const modalIcon = iconForKind(modalKind);

    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                keyExtractor={(it: any) => it.__key}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={{ padding: 24, alignItems: 'center' }}>
                        <Icon name="bell-off" size={28 * scale} color="#9ca3af" />
                        <Text style={{ marginTop: 8, color: '#6b7280', fontSize: 14 * scale }}>
                            No notifications yet
                        </Text>
                    </View>
                }
            />

            {/* Tiny announcement modal */}
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => { }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Icon name={modalIcon.name} size={20} color="#0f172a" />
                            <Text style={styles.modalTitle} numberOfLines={2}>{modalTitle}</Text>
                        </View>
                        <Text style={styles.modalBody}>{modalBody || ' '}</Text>
                        <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn} activeOpacity={0.8}>
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
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

    // Modal
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
    modalTitle: { marginLeft: 8, fontWeight: '700', color: '#0f172a', fontSize: 16, flex: 1 },
    modalBody: { color: '#374151', marginTop: 2, fontSize: 14, lineHeight: 20 },
    closeBtn: { backgroundColor: '#195ed2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
});
