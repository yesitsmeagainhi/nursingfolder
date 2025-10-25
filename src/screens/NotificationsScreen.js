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
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getNotifications, clearNotifications } from '../utils/notificationsStorage';

/** Format Firestore Timestamp | number(ms) | ISO string -> "dd/mm/yyyy, hh:mm…" */
function formatWhen(when) {
    try {
        // Firestore Timestamp?
        if (when && typeof when === 'object') {
            if (typeof when.toDate === 'function') return when.toDate().toLocaleString();
            if (Number.isFinite(when.seconds)) return new Date(when.seconds * 1000).toLocaleString();
        }
        // number?
        if (Number.isFinite(when)) return new Date(when).toLocaleString();
        // string?
        const d = new Date(when);
        if (!isNaN(d.getTime())) return d.toLocaleString();
    } catch { }
    return '';
}

/** Create a stable key even if id is missing */
function makeKey(n) {
    const parts = [
        n.id,
        n?.data?.id,
        n?.data?.path,
        n?.title,
        typeof n.receivedAt?.seconds === 'number' ? n.receivedAt.seconds : n.receivedAt,
    ].filter(Boolean);
    return String(parts.join('|')) || Math.random().toString(36).slice(2);
}

/** Normalize raw notification to a safe, renderable object */
function normalizeNotification(n) {
    const title = n?.title || n?.data?.title || 'Notification';
    const body = n?.body || n?.data?.body || '';
    const when = n?.receivedAt ?? n?.createdAt ?? n?.time;

    return {
        ...n,
        title,
        body,
        receivedAt: when,
        __key: makeKey({ ...n, title, receivedAt: when }),
    };
}

export default function NotificationsScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        setRefreshing(true);
        try {
            const list = await getNotifications();           // your storage fetch
            const normalized = (Array.isArray(list) ? list : []).map(normalizeNotification);
            setItems(normalized);
        } catch (e) {
            setItems([]);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Load once
    useEffect(() => { load(); }, [load]);

    // Reload every time screen regains focus
    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleOpen = (item) => {
        const type = (item?.data?.type || item?.data?.screen || '').toLowerCase();
        const title = item?.data?.title || item.title || 'Video';
        const nodeId = item?.data?.nodeId;
        const url = item?.data?.url || '';                // direct video/pdf/etc.
        const embed = item?.data?.embedUrl || item?.data?.videoUrl || ''; // YouTube/Vimeo
        const path = item?.data?.path;
        const courseId = item?.data?.courseId;

        // Choose the best playable url
        const bestUrl = url || embed;

        // Helper: decide by extension
        const isPdf = (bestUrl || '').toLowerCase().endsWith('.pdf');

        // Prefer the Viewer screen (your app already uses it for videos and pdfs)
        if (type === 'video' || type === 'videoplayer') {
            if (bestUrl) {
                navigation.navigate('Viewer', {
                    title,
                    type: 'video',
                    url: bestUrl,
                    embedUrl: embed || undefined,
                    nodeId,
                });
            } else if (nodeId) {
                // Let the Viewer fetch by nodeId if URL wasn’t embedded in the notif
                navigation.navigate('Viewer', { title, type: 'video', nodeId });
            } else {
                navigation.navigate('Home');
            }
            return;
        }

        if (type === 'pdf' || isPdf) {
            navigation.navigate('Viewer', {
                title,
                type: 'pdf',
                url: bestUrl || url,
                nodeId,
            });
            return;
        }

        if (type === 'folder' || type === 'explorer') {
            if (nodeId) {
                navigation.navigate('Explorer', { openFolderId: nodeId, openFolderName: title });
            } else {
                navigation.navigate('Explorer', { path, courseId });
            }
            return;
        }

        // Fallback
        navigation.navigate('Home');
    };


    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handleOpen(item)}
        >
            <View style={styles.row}>
                <Icon name="bell-ring" size={22} color="#166534" />
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            </View>
            {!!item.body && <Text style={styles.body} numberOfLines={2}>{item.body}</Text>}
            <Text style={styles.time}>{formatWhen(item.receivedAt)}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={async () => {
                        await clearNotifications();
                        load();
                    }}
                    style={styles.clearButton}
                >
                    <Icon name="delete-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                keyExtractor={(it) => it.__key}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
                ListEmptyComponent={
                    <View style={{ padding: 24, alignItems: 'center' }}>
                        <Icon name="bell-off" size={28} color="#9ca3af" />
                        <Text style={{ marginTop: 8, color: '#6b7280' }}>No notifications yet</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        paddingHorizontal: 12, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    },

    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    title: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
    body: { color: '#374151', marginBottom: 6 },
    time: { fontSize: 12, color: '#6b7280' },
});
