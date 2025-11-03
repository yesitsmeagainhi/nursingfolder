import AsyncStorage from '@react-native-async-storage/async-storage';

const ANN_SEEN_KEY = 'announcements_seen_v1';       // map of { [docId]: 1 }
const LOCAL_LAST_SEEN_AT = 'local_notifications_last_seen_at_v1'; // number (ms epoch)

/* ------------ Announcements “seen” map ------------ */
export async function getAnnouncementSeenMap(): Promise<Record<string, 1>> {
    try {
        const s = await AsyncStorage.getItem(ANN_SEEN_KEY);
        return s ? JSON.parse(s) : {};
    } catch { return {}; }
}
export async function setAnnouncementSeenMap(map: Record<string, 1>) {
    try { await AsyncStorage.setItem(ANN_SEEN_KEY, JSON.stringify(map)); } catch { }
}

/* ------------ Local-notif last-seen time ------------ */
export async function getLocalLastSeenAt(): Promise<number> {
    try {
        const v = await AsyncStorage.getItem(LOCAL_LAST_SEEN_AT);
        return v ? Number(v) : 0;
    } catch { return 0; }
}
export async function setLocalLastSeenNow() {
    try { await AsyncStorage.setItem(LOCAL_LAST_SEEN_AT, String(Date.now())); } catch { }
}

/* ------------ Mark-all helpers (call when opening Notifications) ------------ */
export async function markAnnouncementsSeen(ids: string[]) {
    const map = await getAnnouncementSeenMap();
    let changed = false;
    for (const id of ids) {
        if (id && !map[id]) { map[id] = 1; changed = true; }
    }
    if (changed) await setAnnouncementSeenMap(map);
}
