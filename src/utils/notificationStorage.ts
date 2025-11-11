
// src/utils/notificationsStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'notifications_v1';

export interface StoredNotification {
    id?: string;
    title?: string;
    body?: string;
    receivedAt?: number | any;
    data?: Record<string, any>;
    [k: string]: any;
}

export async function getNotifications(): Promise<StoredNotification[]> {
    const raw = await AsyncStorage.getItem(KEY);
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

export async function addNotification(n: StoredNotification): Promise<void> {
    const list = await getNotifications();

    const nodeId = n?.data?.nodeId as string | undefined;
    let idx = -1;
    if (nodeId) idx = list.findIndex((x) => x?.data?.nodeId && x.data.nodeId === nodeId);
    if (idx === -1) idx = list.findIndex((x) => x.id === n.id);

    if (idx >= 0) list[idx] = { ...list[idx], ...n };
    else list.unshift(n);

    await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
}

export async function clearNotifications(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
}
