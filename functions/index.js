// // functions/index.js
// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// admin.initializeApp();

// const buildNotification = (data) => ({
//     notification: {
//         title: '🎥 New Video Published',
//         body: `${data.title || 'A new lesson'}${data.subject ? ' · ' + data.subject : ''}`
//     },
//     data: {
//         type: 'video',
//         title: data.title || '',
//         path: data.path || '',
//         subject: data.subject || '',
//         courseId: data.courseId || '',
//         url: data.url || ''
//     }
// });

// // Broadcast topic (everyone) or scoped topic(s)
// const topicForAll = 'allUsers';
// const topicForCourse = (courseId) => `course_${(courseId || 'general').toLowerCase()}`;

// exports.notifyOnNewNodeCreate = functions.firestore
//     .document('nodes/{nodeId}')
//     .onCreate(async (snap) => {
//         const data = snap.data() || {};
//         if (data.type !== 'video') return null;             // only videos
//         if (data.isPublished === false) return null;        // ignore drafts

//         // Send to global + course-specific topic (if available)
//         const message = buildNotification(data);
//         const promises = [
//             admin.messaging().send({ ...message, topic: topicForAll })
//         ];
//         if (data.courseId) {
//             promises.push(admin.messaging().send({ ...message, topic: topicForCourse(data.courseId) }));
//         }
//         await Promise.all(promises);
//         return null;
//     });
// exports.notifyOnNodePublish = functions.firestore
//     .document('nodes/{nodeId}')
//     .onUpdate(async (change) => {
//         const before = change.before.data() || {};
//         const after = change.after.data() || {};
//         if (after.type !== 'video') return null;

//         const wasDraft = before.isPublished === false || before.isPublished === undefined;
//         const nowLive = after.isPublished === true;
//         if (!(wasDraft && nowLive)) return null; // only when it becomes published

//         const message = {
//             notification: {
//                 title: '🎬 Video Now Live',
//                 body: `${after.title || 'New lesson'} is now available`
//             },
//             data: {
//                 type: 'video',
//                 title: after.title || '',
//                 path: after.path || '',
//                 subject: after.subject || '',
//                 courseId: after.courseId || '',
//                 url: after.url || ''
//             }
//         };

//         const sends = [admin.messaging().send({ ...message, topic: 'allUsers' })];
//         if (after.courseId) {
//             sends.push(admin.messaging().send({ ...message, topic: `course_${after.courseId.toLowerCase()}` }));
//         }
//         await Promise.all(sends);
//         return null;
//     });
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try { admin.initializeApp(); } catch (e) { }

/**
 * IMPORTANT: set this to your Firestore default location.
 * Examples: 'us-central1', 'asia-south1', 'europe-west1'
 */
const REGION = 'us-central1'; // <-- CHANGE THIS IF YOUR PROJECT USES ANOTHER REGION

// Convenience
const db = admin.firestore();

/**
 * Fire on document creation in 'nodes'
 */
exports.onVideoNodeCreate = functions.region(REGION).firestore
    .document('nodes/{docId}')
    .onCreate(async (snap, ctx) => {
        const data = snap.data() || {};
        const docId = snap.id;

        // Skip if already notified (defensive)
        if (data.notifiedAt) {
            console.log('[SKIP] already notified (create)', docId);
            return null;
        }

        if (!isVideoNode(data)) {
            console.log('[SKIP] not a video (create)', docId, { type: data.type });
            return null;
        }

        try {
            await sendVideoNotification(docId, data);
            await markNotified(docId);
            console.log('[OK] notified (create)', docId);
        } catch (err) {
            console.error('[ERR] notify(create)', docId, err);
        }
        return null;
    });

/**
 * Fire on document updates:
 * - when doc becomes a video
 * - when a playable URL is added later
 */
exports.onVideoNodeUpdate = functions.region(REGION).firestore
    .document('nodes/{docId}')
    .onUpdate(async (change, ctx) => {
        const before = change.before.data() || {};
        const after = change.after.data() || {};
        const docId = change.after.id;

        // If we already notified, skip
        if (after.notifiedAt) {
            console.log('[SKIP] already notified (update)', docId);
            return null;
        }

        const beforeIsVideo = isVideoNode(before);
        const afterIsVideo = isVideoNode(after);
        const urlAdded = !hasPlayableUrl(before) && hasPlayableUrl(after);

        if (!beforeIsVideo && afterIsVideo) {
            try {
                await sendVideoNotification(docId, after);
                await markNotified(docId);
                console.log('[OK] notified (became video)', docId);
            } catch (err) {
                console.error('[ERR] notify(became video)', docId, err);
            }
        } else if (afterIsVideo && urlAdded) {
            try {
                await sendVideoNotification(docId, after);
                await markNotified(docId);
                console.log('[OK] notified (url added)', docId);
            } catch (err) {
                console.error('[ERR] notify(url added)', docId, err);
            }
        } else {
            console.log('[SKIP] no notify condition (update)', docId, {
                beforeIsVideo, afterIsVideo, urlAdded
            });
        }
        return null;
    });

/** ---------- helpers ---------- */

function isVideoNode(d = {}) {
    const t = String(d.type || '').trim().toLowerCase();
    return ['video', 'videos', 'youtube', 'mp4'].includes(t);
}

function hasPlayableUrl(d = {}) {
    return Boolean(d.url || d.embedUrl || d?.meta?.videoUrl || d?.meta?.embedUrl);
}

/**
 * Mark the node so we don't notify twice.
 */
async function markNotified(docId) {
    await db.collection('nodes').doc(docId).set(
        { notifiedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
    );
}

/**
 * Send FCM to topic 'all' (must match app subscription).
 * NOTE: No android.notification.channelId here to avoid drops on Android 8+ if the channel isn't created in-app.
 */
async function sendVideoNotification(docId, data) {
    const title = data.name || 'New video added';
    const body = data.subtitle || data.subject || 'Tap to watch';

    const url = data.url || data?.meta?.videoUrl || '';
    const embedUrl = data.embedUrl || data?.meta?.embedUrl || '';

    const message = {
        topic: 'all', // <-- MUST MATCH what your app subscribes to
        notification: { title, body },
        data: {
            type: 'video',
            nodeId: docId,
            title,
            url,
            embedUrl,
        },
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
    };

    console.log('[FCM] sending', { docId, title, hasUrl: !!url, hasEmbed: !!embedUrl });
    return admin.messaging().send(message);
}
