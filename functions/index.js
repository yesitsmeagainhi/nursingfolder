/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// Cloud Functions v1 (free tier friendly)
const functions = require('firebase-functions');        // v1 API
const admin = require('firebase-admin');
const { google } = require('googleapis');

admin.initializeApp(); // needed for Firestore writes

function makeOAuth2(cfg) {
    const oAuth2 = new google.auth.OAuth2(
        cfg.client_id,
        cfg.client_secret
    );
    oAuth2.setCredentials({ refresh_token: cfg.refresh_token });
    return oAuth2;
}
const b64url = (s) =>
    Buffer.from(s, 'utf8').toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Trigger on create/update of contactMessages/{id}
exports.sendContactMail = functions
    .region('asia-south1') // change if you prefer
    .firestore
    .document('contactMessages/{id}')
    .onWrite(async (change, context) => {
        const after = change.after.exists ? change.after.data() : null;
        if (!after) return null;

        const cfg = functions.config().gmail || {};
        if (!cfg.client_id || !cfg.client_secret || !cfg.refresh_token || !cfg.from) {
            console.error('Gmail config missing. Run functions:config:set');
            return null;
        }

        const mail = after.mail || {};
        if (mail.status !== 'pending') return null;

        const name = (after.name || mail.name || 'Visitor').toString().trim();
        const from = (after.email || mail.email || '').toString().trim();
        const message = (after.message || mail.message || '').toString().trim();

        const subject = `New contact message from ${name}`;
        const html =
            `<p><b>Name:</b> ${name}</p>` +
            (from ? `<p><b>Email:</b> ${from}</p>` : '') +
            `<p><b>Message:</b><br>${(message || '(no message)').replace(/\n/g, '<br>')}</p>` +
            `<hr><p style="color:#888">Doc ID: ${context.params.id}</p>`;

        const raw = [
            `From: ABS App <${cfg.from}>`,
            `To: ${cfg.from}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset="UTF-8"',
            '',
            html
        ].join('\r\n');

        try {
            const auth = makeOAuth2(cfg);
            const gmail = google.gmail({ version: 'v1', auth });
            await gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw: b64url(raw) },
            });

            await change.after.ref.set({
                mail: { ...mail, status: 'sent', deliveredAt: new Date().toISOString() }
            }, { merge: true });

        } catch (err) {
            console.error('Gmail send failed:', err?.message || err);
            await change.after.ref.set({
                mail: { ...mail, status: 'failed', error: String(err?.message || err), failedAt: new Date().toISOString() }
            }, { merge: true });
        }

        return null;
    });
