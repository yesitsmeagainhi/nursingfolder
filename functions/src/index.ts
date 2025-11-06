// // functions/src/index.ts
// import * as admin from 'firebase-admin';
// import * as functions from 'firebase-functions';

// admin.initializeApp();

// // ⬅️ set this to your existing video topic (e.g., 'all' or 'students')
// const VIDEO_TOPIC = 'all';

// export const onAnnouncementPublished = functions.firestore
//     .document('announcements/{id}')
//     .onWrite(async (change, ctx) => {
//         const after = change.after.exists ? change.after.data() : null;
//         const before = change.before.exists ? change.before.data() : null;

//         // Only send when it becomes published (new or false -> true)
//         if (!after?.published || before?.published) return;

//         const id = ctx.params.id;
//         const title = after.title || 'Announcement';
//         const body = after.body || '';

//         await admin.messaging().send({
//             topic: VIDEO_TOPIC,                        // 👈 SAME topic as videos
//             notification: { title, body },             // tray shows even if app is killed
//             data: {
//                 type: 'announcement',
//                 id,
//                 nav: 'Notifications',                    // tap routing (same as videos)
//                 title,
//                 body
//             },
//             android: { priority: 'high' },
//         });
//     });
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Helper to build a unified FCM payload.
 * We send BOTH "notification" (for system tray when app is closed)
 * and "data" (for deep-linking when user taps).
 */
function buildPayload(docId: string, a: any) {
    const title = a.title || 'Announcement';
    const body = a.body || a.description || '';
    // you can pass whatever your app expects here:
    const data = {
        id: `ann_${docId}`,
        title,
        body,
        type: 'announcement',
        screen: 'notifications',
        nodeId: a?.data?.nodeId || '',
        url: a?.data?.url || '',
        embedUrl: a?.data?.embedUrl || '',
        courseId: a?.data?.courseId || '',
        path: a?.data?.path || '',
    };
    return {
        notification: { title, body },
        data,
        android: { priority: 'high' as const },
        apns: {
            headers: { 'apns-priority': '10' }, // alert
            payload: { aps: { sound: 'default' } },
        },
    };
}

/**
 * Trigger when a new announcement is created AND published=true.
 */
export const onAnnouncementCreate =
    functions.firestore
        .document('announcements/{id}')
        .onCreate(async (snap, ctx) => {
            const a = snap.data() || {};
            if (!a.published) return;

            const payload = buildPayload(snap.id, a);

            // Choose an audience strategy:
            // 1) topic broadcast (simplest)
            const audience = (a.audience || 'all').toLowerCase();
            const topic = audience.startsWith('course_') ? audience : 'all';

            await messaging.send({
                topic,
                ...payload,
            });
        });

/**
 * Optional: also push when 'published' flips from false -> true.
 */
export const onAnnouncementPublish =
    functions.firestore
        .document('announcements/{id}')
        .onUpdate(async (change, ctx) => {
            const before = change.before.data() || {};
            const after = change.after.data() || {};
            if (before.published === true || after.published !== true) return;

            const payload = buildPayload(change.after.id, after);
            const audience = (after.audience || 'all').toLowerCase();
            const topic = audience.startsWith('course_') ? audience : 'all';

            await messaging.send({
                topic,
                ...payload,
            });
        });
