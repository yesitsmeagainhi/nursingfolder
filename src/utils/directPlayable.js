export function parseUrl(u) {
    try { return new URL((u || '').trim()); } catch { return null; }
}

export function extractDriveId(u) {
    const m1 = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m1 && m1[1]) return m1[1];
    const id = u.searchParams.get('id');
    return id || null;
}

/**
 * Return:
 *  { kind: 'direct', src } → direct mp4/m3u8
 *  { kind: 'drive', src }  → Drive download URL (may still fail for large/private files)
 *  { kind: 'youtube', reason } → cannot inline without embed; open externally
 *  { kind: 'external', src } → not recognized; open externally
 */
export function resolveDirectPlayable(raw) {
    if (!raw || typeof raw !== 'string') return { kind: 'external', src: '' };
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const u = parseUrl(url);
    if (!u) return { kind: 'external', src: url };

    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    // Direct file
    if (/\.(mp4|m4v|mov|m3u8)(\?|#|$)/i.test(u.pathname)) {
        return { kind: 'direct', src: url };
    }

    // Google Drive → try raw download form
    if (host.endsWith('drive.google.com') || host.endsWith('docs.google.com')) {
        const id = extractDriveId(u);
        if (id) {
            const dl = `https://drive.google.com/uc?export=download&id=${id}`;
            return { kind: 'drive', src: dl };
        }
        return { kind: 'external', src: url };
    }

    // YouTube → cannot play original watch/shorts inline without embed
    if (host.endsWith('youtube.com') || host === 'youtu.be' || host.endsWith('m.youtube.com')) {
        return { kind: 'youtube', reason: 'Original watch links are HTML pages; no legal direct stream.' };
    }

    // Unknown → try external
    return { kind: 'external', src: url };
}
