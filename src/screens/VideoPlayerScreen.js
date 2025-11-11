// // src/screens/VideoPlayerScreen.js
// import React, { useEffect, useMemo, useState, useRef } from "react";
// import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from "react-native";
// import { WebView } from "react-native-webview";
// import Video from "react-native-video";
// import firestore from "@react-native-firebase/firestore";

// const BG = "#000";
// const { width } = Dimensions.get("window");
// const PLAYER_H = Math.round((width - 24) * 9 / 16);

// // ——— helpers ———
// function getDriveId(input) {
//   try {
//     if (!input) return "";
//     let s = input.trim();
//     if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
//     const u = new URL(s);
//     const m = u.pathname.match(/\/file\/d\/([^/]+)/);
//     return (m && m[1]) || u.searchParams.get("id") || "";
//   } catch { return ""; }
// }

// function toPlayable(raw) {
//   if (!raw) return { mode: "unknown", url: "", baseUrl: "https://localhost" };
//   let s = raw.trim();
//   if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
//   try {
//     const u = new URL(s);
//     const host = u.hostname.toLowerCase();

//     // Drive: prefer native streaming (single controls), fallback to preview
//     if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
//       const id = getDriveId(s);
//       if (id) {
//         return {
//           mode: "drive-native",
//           direct: `https://drive.google.com/uc?export=download&id=${id}`,
//           preview: `https://drive.google.com/file/d/${id}/preview`,
//           baseUrl: "https://drive.google.com",
//         };
//       }
//     }

//     // YouTube (keep iframe; YT’s controls are expected)
//     if (host.includes("youtube.com") || host.includes("youtu.be")) {
//       // basic ID extraction
//       let vid = "";
//       if (host.includes("youtu.be")) vid = new URL(s).pathname.slice(1);
//       else if (new URL(s).pathname.startsWith("/shorts/")) vid = new URL(s).pathname.split("/")[2] || "";
//       else if (new URL(s).pathname.startsWith("/embed/")) vid = new URL(s).pathname.split("/")[2] || "";
//       else vid = new URL(s).searchParams.get("v") || "";
//       if (vid) {
//         return {
//           mode: "yt-embed",
//           url: `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`,
//           baseUrl: "https://www.youtube-nocookie.com",
//         };
//       }
//     }

//     // Others as-is (CDN players etc.)
//     return { mode: "page", url: s, baseUrl: u.origin };
//   } catch {
//     return { mode: "page", url: s, baseUrl: "https://localhost" };
//   }
// }

// function htmlIframe(src) {
//   return `<!doctype html><html><head>
// <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
// <style>
//   html,body{margin:0;height:100%;background:#000}
//   #wrap{position:fixed;inset:0}
//   iframe{width:100%;height:100%;border:0;background:#000}
// </style></head>
// <body><div id="wrap">
// <iframe src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
// </div></body></html>`;
// }

// // ——— component ———
// export default function VideoPlayerScreen({ route, navigation }) {
//   const { nodeId, url: routeUrl, title = "Video" } = route?.params || {};
//   const [rawUrl, setRawUrl] = useState(routeUrl || "");
//   const playable = useMemo(() => toPlayable(rawUrl), [rawUrl]);

//   // states for native (drive) playback UX
//   const [usePreview, setUsePreview] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [buffering, setBuffering] = useState(false);
//   const [started, setStarted] = useState(false);
//   const guardRef = useRef(null);

//   // fetch from Firestore if nodeId provided
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       if (!routeUrl && nodeId) {
//         try {
//           const snap = await firestore().collection("nodes").doc(String(nodeId)).get();
//           const d = snap.data() || {};
//           const u = d.url || "";
//           if (alive) setRawUrl(u);
//         } catch {
//           Alert.alert("Error", "Could not load video.");
//         }
//       }
//     })();
//     return () => { alive = false; };
//   }, [nodeId, routeUrl]);

//   // reset UI when url changes
//   useEffect(() => {
//     setUsePreview(false);
//     setLoading(false);
//     setBuffering(false);
//     setStarted(false);
//     if (guardRef.current) clearTimeout(guardRef.current);
//   }, [rawUrl]);

//   // start guard for slow Drive streams → fallback to preview after 8s if not started
//   useEffect(() => {
//     if (playable.mode === "drive-native" && !usePreview && !started) {
//       setLoading(true);
//       guardRef.current = setTimeout(() => {
//         if (!started) setUsePreview(true);
//       }, 8000);
//     }
//     return () => { if (guardRef.current) clearTimeout(guardRef.current); };
//   }, [playable.mode, usePreview, started]);

//   return (
//     <View style={styles.root}>
//       {/* header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
//           <Text style={styles.backTxt}>←</Text>
//         </TouchableOpacity>
//         <Text style={styles.title} numberOfLines={1}>{title}</Text>
//         <View style={{ width: 34 }} />
//       </View>

//       {/* player */}
//       <View style={styles.box}>
//         {/* Drive → Native (single controls) */}
//         {playable.mode === "drive-native" && !usePreview && (
//           <View style={{ flex: 1 }}>
//             <Video
//               key={playable.direct}
//               source={{
//                 uri: playable.direct,
//                 headers: {
//                   "User-Agent": "Mozilla/5.0",
//                   "Accept": "*/*",
//                   "Referer": "https://drive.google.com/",
//                 },
//               }}
//               style={{ width: "100%", height: "100%" }}
//               resizeMode="contain"
//               controls   // <- only ONE control set (from native player)
//               paused={false}
//               playInBackground={false}
//               playWhenInactive={false}
//               ignoreSilentSwitch="ignore"
//               onLoadStart={() => { setLoading(true); setBuffering(false); }}
//               onLoad={() => { setLoading(false); setStarted(true); }}
//               onReadyForDisplay={() => { setLoading(false); setStarted(true); }}
//               onProgress={(p) => {
//                 if (!started && p?.currentTime > 0) {
//                   setStarted(true);
//                   setLoading(false);
//                 }
//               }}
//               onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
//               onError={() => setUsePreview(true)}
//               bufferConfig={{
//                 minBufferMs: 15000,
//                 maxBufferMs: 50000,
//                 bufferForPlaybackMs: 2500,
//                 bufferForPlaybackAfterRebufferMs: 5000,
//               }}
//               automaticallyWaitsToMinimizeStalling
//             />

//             {(loading || buffering) && (
//               <View style={styles.overlay}>
//                 <Text style={styles.overlayTxt}>{loading ? "Loading…" : "Buffering…"}</Text>
//               </View>
//             )}

//             {!started && (
//               <TouchableOpacity style={styles.altBtn} onPress={() => setUsePreview(true)}>
//                 <Text style={styles.altTxt}>Try alternate player</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}

//         {/* Drive → Preview (fallback, may show Google’s own play overlay) */}
//         {playable.mode === "drive-native" && usePreview && (
//           <WebView
//             source={{ html: htmlIframe(playable.preview), baseUrl: playable.baseUrl }}
//             style={{ flex: 1 }}
//             javaScriptEnabled
//             domStorageEnabled
//             thirdPartyCookiesEnabled
//             allowsFullscreenVideo
//             allowsInlineMediaPlayback
//             mediaPlaybackRequiresUserAction={false}
//             startInLoadingState
//           />
//         )}

//         {/* YouTube (single iframe with YT controls) */}
//         {playable.mode === "yt-embed" && (
//           <WebView
//             source={{ html: htmlIframe(playable.url), baseUrl: playable.baseUrl }}
//             style={{ flex: 1 }}
//             javaScriptEnabled
//             domStorageEnabled
//             thirdPartyCookiesEnabled
//             allowsFullscreenVideo
//             allowsInlineMediaPlayback
//             mediaPlaybackRequiresUserAction={false}
//             startInLoadingState
//           />
//         )}

//         {/* Other URLs */}
//         {playable.mode === "page" && (
//           <WebView
//             source={{ uri: playable.url, baseUrl: playable.baseUrl }}
//             style={{ flex: 1 }}
//             javaScriptEnabled
//             domStorageEnabled
//             thirdPartyCookiesEnabled
//             allowsFullscreenVideo
//             allowsInlineMediaPlayback
//             mediaPlaybackRequiresUserAction={false}
//             startInLoadingState
//           />
//         )}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1, backgroundColor: BG, padding: 12 },
//   header: {
//     paddingHorizontal: 8, paddingVertical: 8,
//     flexDirection: "row", alignItems: "center", gap: 10,
//   },
//   backBtn: {
//     width: 34, height: 34, borderRadius: 17,
//     backgroundColor: "rgba(255,255,255,0.2)",
//     alignItems: "center", justifyContent: "center",
//   },
//   backTxt: { color: "#fff", fontSize: 18, fontWeight: "800" },
//   title: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "800" },

//   box: {
//     width: "100%",
//     height: PLAYER_H,
//     borderRadius: 12,
//     overflow: "hidden",
//     backgroundColor: "#000",
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.25)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   overlayTxt: { color: "#fff", fontWeight: "700" },
//   altBtn: {
//     position: "absolute", right: 12, bottom: 12,
//     backgroundColor: "rgba(25,94,210,0.9)", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8
//   },
//   altTxt: { color: "#fff", fontWeight: "700" },
// });
// src/screens/VideoPlayerScreen.js
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator, Platform
} from "react-native";
import { WebView } from "react-native-webview";
import Video from "react-native-video";
import firestore from "@react-native-firebase/firestore";

const BG = "#000";
const { width } = Dimensions.get("window");
const PLAYER_H = Math.round((width - 24) * 9 / 16);

// ── helpers ─────────────────────────────────────────────────────────
function getDriveId(input) {
  try {
    if (!input) return "";
    let s = input.trim();
    if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
    const u = new URL(s);
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    return (m && m[1]) || u.searchParams.get("id") || "";
  } catch { return ""; }
}

function toPlayable(raw) {
  if (!raw) return { mode: "unknown", url: "", baseUrl: "https://localhost" };
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();

    // Drive (provide both direct + preview; we'll choose tier later)
    if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
      const id = getDriveId(s);
      if (id) {
        return {
          mode: "drive", // we will render native/html5/preview based on state
          direct: `https://drive.google.com/uc?export=download&id=${id}`,
          preview: `https://drive.google.com/file/d/${id}/preview?autoplay=1&mute=1`,
          baseUrl: "https://drive.google.com",
        };
      }
    }

    // YouTube -> nocookie embed
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let vid = "";
      if (host.includes("youtu.be")) vid = u.pathname.slice(1);
      else if (u.pathname.startsWith("/shorts/")) vid = u.pathname.split("/")[2] || "";
      else if (u.pathname.startsWith("/embed/")) vid = u.pathname.split("/")[2] || "";
      else vid = u.searchParams.get("v") || "";
      if (vid) {
        return {
          mode: "yt",
          url: `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`,
          baseUrl: "https://www.youtube-nocookie.com",
        };
      }
    }

    // Others as-is (CDN players etc.)
    return { mode: "page", url: s, baseUrl: u.origin };
  } catch {
    return { mode: "page", url: s, baseUrl: "https://localhost" };
  }
}

function htmlIframe(src) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>
  html,body{margin:0;height:100%;background:#000}
  #wrap{position:fixed;inset:0}
  iframe{width:100%;height:100%;border:0;background:#000}
</style></head>
<body><div id="wrap">
<iframe src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
</div></body></html>`;
}

function htmlVideo(src) {
  // Single HTML5 player with a loader overlay
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>
  html,body{margin:0;height:100%;background:#000}
  #wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
  video{width:100%;height:100%;background:#000}
  #loader{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:system-ui, Arial}
</style></head>
<body>
  <div id="wrap">
    <div id="loader">Loading…</div>
    <video id="v" controls playsinline autoplay muted>
      <source src="${src}">
    </video>
  </div>
  <script>
    const v = document.getElementById('v');
    const loader = document.getElementById('loader');
    const show = () => { if (loader) loader.style.display='flex'; };
    const hide = () => { if (loader) loader.style.display='none'; };
    v.addEventListener('canplay', () => {
      hide();
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('started');
    });
    v.addEventListener('waiting', show);
    v.addEventListener('playing', hide);
  </script>
</body></html>`;
}

// ── component ───────────────────────────────────────────────────────
export default function VideoPlayerScreen({ route, navigation }) {
  const { nodeId, url: routeUrl, title = "Video" } = route?.params || {};
  const [rawUrl, setRawUrl] = useState(routeUrl || "");
  const playable = useMemo(() => toPlayable(rawUrl), [rawUrl]);

  // Tier state for Drive
  const [mode, setMode] = useState("page"); // 'native' | 'html5' | 'preview' | 'yt' | 'page'
  const [loading, setLoading] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [started, setStarted] = useState(false);
  const guardRef = useRef(null);

  // fetch URL from Firestore if nodeId given
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!routeUrl && nodeId) {
        try {
          const snap = await firestore().collection("nodes").doc(String(nodeId)).get();
          const d = snap.data() || {};
          const u = d.url || "";
          if (alive) setRawUrl(u);
        } catch {
          Alert.alert("Error", "Could not load video.");
        }
      }
    })();
    return () => { alive = false; };
  }, [nodeId, routeUrl]);

  // pick tier mode on input change
  useEffect(() => {
    setStarted(false);
    setLoading(false);
    setBuffering(false);
    if (guardRef.current) clearTimeout(guardRef.current);

    if (playable.mode === "yt") { setMode("yt"); return; }
    if (playable.mode === "drive") { setMode("native"); return; }
    setMode(playable.mode); // page/unknown
  }, [playable]);

  // guard: if native stream doesn’t start in 10s → html5, then preview on error
  useEffect(() => {
    if (mode === "native" && playable.mode === "drive" && !started) {
      setLoading(true);
      guardRef.current = setTimeout(() => {
        if (!started) setMode("html5");
      }, 10000);
    }
    return () => { if (guardRef.current) clearTimeout(guardRef.current); };
  }, [mode, started, playable.mode]);

  return (
    <View style={styles.root}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* player box */}
      <View style={styles.box}>
        {/* Drive: Native (single controls) */}
        {playable.mode === "drive" && mode === "native" && (
          <View style={{ flex: 1 }}>
            <Video
              key={playable.direct}
              source={{
                uri: playable.direct,
                headers: {
                  "User-Agent": "Mozilla/5.0",
                  "Accept": "*/*",
                  "Referer": "https://drive.google.com/",
                },
              }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
              controls
              paused={false}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              onLoadStart={() => { setLoading(true); setBuffering(false); }}
              onLoad={() => { setLoading(false); setStarted(true); }}
              onReadyForDisplay={() => { setLoading(false); setStarted(true); }}
              onProgress={(p) => {
                if (!started && p?.currentTime > 0) {
                  setStarted(true);
                  setLoading(false);
                }
              }}
              onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
              onError={() => setMode("html5")}
              bufferConfig={{
                minBufferMs: 15000,
                maxBufferMs: 50000,
                bufferForPlaybackMs: 2500,
                bufferForPlaybackAfterRebufferMs: 5000,
              }}
              automaticallyWaitsToMinimizeStalling
              useTextureView={Platform.OS === "android"}
            />
            {(loading || buffering) && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" />
                <Text style={styles.overlayTxt}>{loading ? "Loading…" : "Buffering…"}</Text>
              </View>
            )}
          </View>
        )}

        {/* Drive: HTML5 video (single controls in WebView) */}
        {playable.mode === "drive" && mode === "html5" && (
          <WebView
            key={"html5:" + playable.direct}
            source={{ html: htmlVideo(playable.direct), baseUrl: playable.baseUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            onMessage={(e) => { if (e?.nativeEvent?.data === "started") setStarted(true); }}
            onError={() => setMode("preview")}
            setSupportMultipleWindows={false}
          />
        )}

        {/* Drive: Preview (last resort, Google’s overlay) */}
        {playable.mode === "drive" && mode === "preview" && (
          <WebView
            key={"preview:" + playable.preview}
            source={{ html: htmlIframe(playable.preview), baseUrl: playable.baseUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            setSupportMultipleWindows={false}
          />
        )}

        {/* YouTube */}
        {playable.mode === "yt" && mode === "yt" && (
          <WebView
            key={"yt:" + playable.url}
            source={{ html: htmlIframe(playable.url), baseUrl: playable.baseUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(req) => !/^intent:|^vnd\.youtube:/i.test(req?.url || "")}
          />
        )}

        {/* Other URLs */}
        {playable.mode === "page" && (
          <WebView
            key={"page:" + playable.url}
            source={{ uri: playable.url, baseUrl: playable.baseUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            setSupportMultipleWindows={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, padding: 12 },
  header: {
    paddingHorizontal: 8, paddingVertical: 8,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  backTxt: { color: "#fff", fontSize: 18, fontWeight: "800" },
  title: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "800" },

  box: {
    width: "100%",
    height: PLAYER_H,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  overlayTxt: { color: "#fff", fontWeight: "700" },
});
