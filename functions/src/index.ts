// functions/src/index.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();
setGlobalOptions({ region: 'asia-south1' }); // pick your region

// Push when a new announcement is created and published
export const onAnnouncementCreate = onDocumentCreated('announcements/{id}', async (event) => {
    const snap = event.data;
    if (!snap) return;
    const a = snap.data() as any;

    if (a?.published === false) return;

    const id = event.params.id as string;
    const title = a?.title || 'New announcement';
    const body = a?.body || '';

    await getMessaging().send({
        topic: 'all',
        notification: { title, body },
        data: {
            nav: 'Notifications',
            screen: 'notifications',
            type: 'notifications',
            id,
            title,
            body,
            ...(a?.data?.nodeId ? { nodeId: String(a.data.nodeId) } : {}),
            ...(a?.data?.url ? { url: String(a.data.url) } : {}),
        },
    });
});

// Optional: push when a new video node is created
export const onVideoNodeCreate = onDocumentCreated('nodes/{id}', async (event) => {
    const n = event.data?.data() as any;
    if (!n) return;
    const t = String(n?.type || '').toLowerCase();
    if (!['video', 'videos', 'youtube', 'mp4'].includes(t)) return;

    const title = n.name || 'New video';
    const body = n.subtitle || 'Tap to view';

    await getMessaging().send({
        topic: 'all',
        notification: { title, body },
        data: {
            nav: 'Notifications',
            screen: 'notifications',
            type: 'notifications',
            id: String(event.params.id),
            nodeId: String(event.params.id),
            title,
            body,
            url: n.url || '',
            embedUrl: n.embedUrl || '',
        },
    });
});
