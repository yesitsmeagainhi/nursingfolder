import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

// reuse your seen map so we don't duplicate
const SEEN_KEY = 'announcements_seen_v1';
const LAST_POLL_KEY = 'announcements_last_poll_ms';

async function getSeenMap() {
    try { const s = await AsyncStorage.getItem(SEEN_KEY); return s ? JSON.parse(s) : {}; } catch { return {}; }
}
async function setSeenMap(m: Record<string, number>) {
    try { await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(m)); } catch { }
}
async function getLastPollMs() {
    try { const v = await AsyncStorage.getItem(LAST_POLL_KEY); return v ? Number(v) : 0; } catch { return 0; }
}
async function setLastPollMs(ms: number) {
    try { await AsyncStorage.setItem(LAST_POLL_KEY, String(ms)); } catch { }
}

export async function pollAnnouncementsAndNotify() {
    // wake-safe: make sure channel exists
    await notifee.createChannel({ id: 'default', name: 'General', importance: AndroidImportance.HIGH });

    const seen = await getSeenMap();
    const lastPoll = await getLastPollMs();

    // Query latest published announcements (limit small to be cheap)
    let q = firestore()
        .collection('announcements')
        .where('published', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(10);

    const snap = await q.get();
    let newestTs = lastPoll;

    for (const doc of snap.docs) {
        const d = doc.data() || {};
        const id = doc.id;
        const title = d.title || 'Announcement';
        const body = d.body || '';
        const createdAtMs =
            d.createdAt?.toMillis?.() ??
            (d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now());

        // track newest seen createdAt to move the window forward
        if (createdAtMs > newestTs) newestTs = createdAtMs;

        // de-dupe: if we've seen id, skip
        if (seen[id]) continue;

        // If created after last poll (or first run), show it
        if (!lastPoll || createdAtMs > lastPoll) {
            await notifee.displayNotification({
                title,
                body,
                android: { channelId: 'default', pressAction: { id: 'open' } },
                data: { nav: 'Notifications', type: 'announcement', id },
            });
            seen[id] = 1;
        }
    }

    await setSeenMap(seen);
    if (newestTs > lastPoll) await setLastPollMs(newestTs);
}
