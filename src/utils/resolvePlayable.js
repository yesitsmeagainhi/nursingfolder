export function resolvePlayable(raw) {
    if (!raw || typeof raw !== "string") return { kind: "unknown", src: "" };

    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    try {
        const u = new URL(url);
        const host = (u.hostname || "").replace(/^www\./, "");

        // Direct media → in-app
        if (/\.(mp4|m4v|mov|m3u8)(\?|#|$)/i.test(url)) {
            return { kind: "direct", src: url };
        }

        // YouTube → external
        if (host === "youtu.be") {
            const id = u.pathname.replace("/", "");
            return { kind: "youtube", src: `https://www.youtube.com/watch?v=${id}`, id };
        }
        if (host.endsWith("youtube.com")) {
            if (u.pathname === "/watch") {
                const id = u.searchParams.get("v");
                if (id) return { kind: "youtube", src: url, id };
            }
            if (u.pathname.startsWith("/shorts/")) {
                const id = u.pathname.split("/")[2];
                return { kind: "youtube", src: `https://www.youtube.com/watch?v=${id}`, id };
            }
            return { kind: "youtube", src: url };
        }

        // Drive → we’ll try to convert to direct via API key
        if (host.endsWith("drive.google.com") || host.endsWith("docs.google.com")) {
            return { kind: "drive", src: url };
        }

        // Unknown → try WebView (might contain its own <video>)
        return { kind: "unknown", src: url };
    } catch {
        return { kind: "unknown", src: url };
    }
}
