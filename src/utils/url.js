// src/utils/url.js
// Keep it tiny: we only normalize Drive; YouTube stays raw (handled in ViewerScreen).

export function normalizeVideoUrl(raw) {
    let input = (raw || '').trim();
    if (!input) return { provider: 'custom', url: '' };
    if (!/^https?:\/\//i.test(input)) input = `https://${input}`;

    try {
        const u = new URL(input);
        const host = u.hostname.replace(/^www\./, '').toLowerCase();

        // Google Drive → /preview
        if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
            const m = u.pathname.match(/\/file\/d\/([^/]+)/);
            const id = (m && m[1]) || u.searchParams.get('id') || '';
            return {
                provider: 'drive',
                url: id ? `https://drive.google.com/file/d/${id}/preview` : input,
            };
        }

        // YouTube stays raw; ViewerScreen handles embed/fallback
        if (host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com')) {
            return { provider: 'youtube', url: input };
        }

        return { provider: 'custom', url: input };
    } catch {
        return { provider: 'custom', url: input };
    }
}
