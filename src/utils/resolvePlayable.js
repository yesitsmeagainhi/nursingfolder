// src/utils/resolvePlayable.js
const YT_EMBED = (id) => `https://www.youtube.com/embed/${id}`;
const VIMEO_EMBED = (id) => `https://player.vimeo.com/video/${id}`;
const DRIVE_PREVIEW = (id) => `https://drive.google.com/file/d/${id}/preview`;

function parseYouTubeId(raw) {
    try {
        const url = raw.startsWith('http') ? raw : `https://${raw}`;
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') return u.pathname.replace('/', '') || null;
        if (host.endsWith('youtube.com') || host === 'm.youtube.com') {
            if (u.pathname === '/watch') return u.searchParams.get('v');
            if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
            if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
        }
        return null;
    } catch { return null; }
}

function parseVimeoId(raw) {
    try {
        const url = raw.startsWith('http') ? raw : `https://${raw}`;
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, '');
        if (host.endsWith('vimeo.com')) {
            const m = u.pathname.match(/(\d+)/);
            return m && m[1];
        }
        return null;
    } catch { return null; }
}

function parseDriveId(raw) {
    try {
        const url = raw.startsWith('http') ? raw : `https://${raw}`;
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, '');
        if (host.endsWith('drive.google.com') || host.endsWith('docs.google.com')) {
            const m1 = u.pathname.match(/\/file\/d\/([^/]+)/);
            if (m1 && m1[1]) return m1[1];
            const id2 = u.searchParams.get('id');
            if (id2) return id2;
        }
        return null;
    } catch { return null; }
}

function normalizeDropbox(raw) {
    // https://www.dropbox.com/s/XXXX/file.mp4?dl=0  -> https://dl.dropboxusercontent.com/s/XXXX/file.mp4
    try {
        const u = new URL(raw);
        if (u.hostname.endsWith('dropbox.com')) {
            u.hostname = 'dl.dropboxusercontent.com';
            u.searchParams.delete('dl');
            return u.toString();
        }
    } catch { }
    return null;
}

export function resolvePlayable(raw) {
    if (!raw) return { renderer: 'external', src: '', reason: 'empty-url' };
    const url = raw.startsWith('http') ? raw : `https://${raw}`;

    // 1) YouTube → YouTube renderer
    const yt = parseYouTubeId(url);
    if (yt) return { renderer: 'youtube', src: YT_EMBED(yt) };

    // 2) Vimeo → iframe
    const vimeo = parseVimeoId(url);
    if (vimeo) return { renderer: 'web', src: VIMEO_EMBED(vimeo) };

    // 3) Google Drive → /preview iframe (must be public)
    const drive = parseDriveId(url);
    if (drive) return { renderer: 'web', src: DRIVE_PREVIEW(drive), provider: 'drive' };

    // 4) Dropbox → direct file
    const dbx = normalizeDropbox(url);
    if (dbx) return { renderer: 'native', src: dbx };

    // 5) Direct MP4/HLS
    if (/\.(mp4|m4v|mov|m3u8)(\?|#|$)/i.test(url)) return { renderer: 'native', src: url };

    // 6) Known “no-embed” sites → external
    if (/photos\.google|instagram\.com|facebook\.com|x\.com|twitter\.com/i.test(url)) {
        return { renderer: 'external', src: url, reason: 'provider-no-embed' };
    }

    // 7) Unknown → try iframe (may still be blocked)
    return { renderer: 'web', src: url };
}
