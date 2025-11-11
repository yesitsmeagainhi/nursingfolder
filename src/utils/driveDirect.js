// Extract the fileId and return a direct media URL via Drive API
export function extractDriveId(anyUrl) {
    try {
        const u = new URL(anyUrl);
        const host = (u.hostname || "").replace(/^www\./, "");
        if (!/drive\.google\.com|docs\.google\.com/.test(host)) return null;

        const m = u.pathname.match(/\/file\/d\/([^/]+)/);
        if (m && m[1]) return m[1];

        const q = u.searchParams.get("id");
        if (q) return q;

        return null;
    } catch {
        return null;
    }
}

// Build a direct-media link. File must be public OR your key must have access.
export function driveDirectUrl(fileId, apiKey) {
    if (!fileId || !apiKey) return null;
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
}
