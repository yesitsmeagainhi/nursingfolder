// functions/src/index.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

// ⬅️ set this to your existing video topic (e.g., 'all' or 'students')
const VIDEO_TOPIC = 'all';

export const onAnnouncementPublished = functions.firestore
    .document('announcements/{id}')
    .onWrite(async (change, ctx) => {
        const after = change.after.exists ? change.after.data() : null;
        const before = change.before.exists ? change.before.data() : null;

        // Only send when it becomes published (new or false -> true)
        if (!after?.published || before?.published) return;

        const id = ctx.params.id;
        const title = after.title || 'Announcement';
        const body = after.body || '';

        await admin.messaging().send({
            topic: VIDEO_TOPIC,                        // 👈 SAME topic as videos
            notification: { title, body },             // tray shows even if app is killed
            data: {
                type: 'announcement',
                id,
                nav: 'Notifications',                    // tap routing (same as videos)
                title,
                body
            },
            android: { priority: 'high' },
        });
    });
