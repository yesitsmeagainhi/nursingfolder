// // src/utils/url.ts
// export type Provider = "youtube" | "drive" | "custom";

// export function normalizeVideoUrl(raw: string): { provider: Provider; url: string } {
//     let input = (raw || "").trim();
//     if (!input) return { provider: "custom", url: "" };
//     if (!/^https?:\/\//i.test(input)) input = `https://${input}`;

//     try {
//         const u = new URL(input);
//         const host = u.hostname.replace(/^www\./, "").toLowerCase();

//         // ---- YOUTUBE: strip playlists/radio/shorts; keep only single video id ----
//         if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("youtube-nocookie.com")) {
//             let id = "";
//             if (host.includes("youtu.be")) id = u.pathname.slice(1);
//             else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] || "";
//             else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] || "";
//             else id = u.searchParams.get("v") || "";   // works even if &list=... present

//             // clean, single-video embed (no playlist/mix params)
//             if (id) {
//                 return {
//                     provider: "youtube",
//                     url: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`
//                 };
//             }
//             return { provider: "youtube", url: input };
//         }

//         // ---- GOOGLE DRIVE: convert to /preview ----
//         if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
//             const m = u.pathname.match(/\/file\/d\/([^/]+)/);
//             const id = (m && m[1]) || u.searchParams.get("id") || "";
//             if (id) {
//                 return { provider: "drive", url: `https://drive.google.com/file/d/${id}/preview` };
//             }
//             return { provider: "drive", url: input };
//         }

//         return { provider: "custom", url: input };
//     } catch {
//         return { provider: "custom", url: input };
//     }
// }
export type Provider = "youtube" | "drive" | "custom";

export function classifyVideo(raw: string): { provider: Provider; url: string; id?: string } {
    let input = (raw || "").trim();
    if (!input) return { provider: "custom", url: "" };
    if (!/^https?:\/\//i.test(input)) input = `https://${input}`;

    try {
        const u = new URL(input);
        const host = u.hostname.replace(/^www\./, "").toLowerCase();

        // ---- YOUTUBE: DO NOT EMBED. Build clean watch-page URL.
        if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("youtube-nocookie.com")) {
            let id = "";
            if (host.includes("youtu.be")) id = u.pathname.slice(1);
            else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] || "";
            else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] || "";
            else id = u.searchParams.get("v") || "";
            return id
                ? { provider: "youtube", id, url: `https://m.youtube.com/watch?v=${id}` }
                : { provider: "youtube", url: input };
        }

        // ---- GOOGLE DRIVE: keep embedding via /preview
        if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
            const m = u.pathname.match(/\/file\/d\/([^/]+)/);
            const id = (m && m[1]) || u.searchParams.get("id") || "";
            return id
                ? { provider: "drive", id, url: `https://drive.google.com/file/d/${id}/preview` }
                : { provider: "drive", url: input };
        }

        return { provider: "custom", url: input };
    } catch {
        return { provider: "custom", url: input };
    }
}
