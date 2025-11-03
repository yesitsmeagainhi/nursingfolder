import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_KEY = 'announcements_dismissed_v1';

export async function getDismissedMap() {
    try {
        const s = await AsyncStorage.getItem(DISMISSED_KEY);
        return s ? JSON.parse(s) : {};
    } catch {
        return {};
    }
}

export async function setDismissedMap(map) {
    try {
        await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
    } catch { }
}

export async function dismissMany(ids = []) {
    if (!Array.isArray(ids) || !ids.length) return;
    const map = await getDismissedMap();
    for (const id of ids) map[id] = 1;
    await setDismissedMap(map);
}
