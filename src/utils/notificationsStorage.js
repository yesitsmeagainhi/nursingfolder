// import AsyncStorage from '@react-native-async-storage/async-storage';

// const KEY = 'notifications:v1';

// export async function getNotifications() {
//     try {
//         const raw = await AsyncStorage.getItem(KEY);
//         return raw ? JSON.parse(raw) : [];
//     } catch {
//         return [];
//     }
// }

// export async function addNotification(item) {
//     // item shape:
//     // { id, title, body, data, receivedAt }
//     try {
//         const list = await getNotifications();
//         // de-dupe by id if present
//         const exists = item.id && list.some(n => n.id === item.id);
//         const next = exists ? list : [item, ...list].slice(0, 200); // cap to 200
//         await AsyncStorage.setItem(KEY, JSON.stringify(next));
//     } catch { }
// }

// export async function clearNotifications() {
//     try { await AsyncStorage.removeItem(KEY); } catch { }
// }
// src/utils/notificationsStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'notifications_v1';

export async function getNotifications() {
    const raw = await AsyncStorage.getItem(KEY);
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

export async function addNotification(n: any) {
    const list = await getNotifications();

    // Prefer unique by nodeId for content-based alerts
    const nodeId = n?.data?.nodeId;
    let idx = -1;
    if (nodeId) {
        idx = list.findIndex((x: any) => x?.data?.nodeId && x.data.nodeId === nodeId);
    }
    if (idx === -1) {
        // fallback: by id
        idx = list.findIndex((x: any) => x.id === n.id);
    }

    if (idx >= 0) {
        // merge/update existing
        list[idx] = { ...list[idx], ...n };
    } else {
        list.unshift(n); // newest on top
    }

    await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
}

export async function clearNotifications() {
    await AsyncStorage.removeItem(KEY);
}
