// src/screens/VideoPlayerScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking, Alert } from "react-native";
import { WebView } from "react-native-webview";
import firestore from "@react-native-firebase/firestore";

const BG = "#000";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

const { width } = Dimensions.get("window");
const PLAYER_H = Math.round((width - 24) * 9 / 16);

/** Make an embeddable URL for YouTube / Drive. Leave others as-is. */
function toEmbed(raw) {
  if (!raw) return { url: "", baseUrl: "https://localhost", kind: "unknown" };
  let input = raw.trim();
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`;

  try {
    const u = new URL(input);
    const host = u.hostname.toLowerCase();

    // ---- YouTube
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let id = "";
      if (host.includes("youtu.be")) {
        id = u.pathname.slice(1);
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/")[2] || "";
      } else if (u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/")[2] || "";
      } else {
        id = u.searchParams.get("v") || "";
      }
      if (id) {
        // nocookie domain + safe params; still subject to owner “no embed” policies.
        return {
          url: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`,
          baseUrl: "https://www.youtube-nocookie.com",
          kind: "youtube",
        };
      }
    }

    // ---- Google Drive (/file/d/<id>/preview or ?id=)
    if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = (m && m[1]) || u.searchParams.get("id") || "";
      if (id) {
        return {
          url: `https://drive.google.com/file/d/${id}/preview`,
          baseUrl: "https://drive.google.com",
          kind: "drive",
        };
      }
    }

    // Anything else: try as-is (some CDNs expose their own players)
    return { url: input, baseUrl: u.origin, kind: "other" };
  } catch {
    return { url: input, baseUrl: "https://localhost", kind: "other" };
  }
}

export default function VideoPlayerScreen({ route, navigation }) {
  const { nodeId, url: routeUrl, title = "Video" } = route?.params || {};
  const [rawUrl, setRawUrl] = useState(routeUrl || "");
  const [note, setNote] = useState("");

  // If nodeId is provided, fetch the node and use its raw url
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!routeUrl && nodeId) {
        try {
          const snap = await firestore().collection("nodes").doc(String(nodeId)).get();
          const d = snap.data() || {};
          const u = d.url || ""; // we do NOT rely on stored embedUrl anymore
          if (alive) setRawUrl(u);
        } catch (e) {
          if (alive) setNote("Could not load video.");
        }
      }
    })();
    return () => { alive = false; };
  }, [nodeId, routeUrl]);

  const playable = useMemo(() => toEmbed(rawUrl), [rawUrl]);

  const playerHtml = useMemo(() => {
    if (!playable.url) return "";
    // One simple HTML shell that keeps the iframe inside the WebView.
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <style>
    html,body { margin:0; padding:0; background:#000; height:100%; }
    #wrap { position:fixed; inset:0; }
    iframe { width:100%; height:100%; border:0; background:#000; }
    video { width:100%; height:100%; background:#000; }
  </style>
</head>
<body>
  <div id="wrap">
    ${
      // If the URL looks like an iframe player (YouTube/Drive/etc.), use iframe.
      // If you later pass a direct mp4, this same shell can handle a <video> tag (optional).
      `<iframe src="${playable.url}"
         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
         allowfullscreen></iframe>`
      }
  </div>
</body>
</html>`;
  }, [playable]);

  const openOriginal = async () => {
    try {
      if (rawUrl && (await Linking.canOpenURL(rawUrl))) {
        await Linking.openURL(rawUrl);
      }
    } catch {
      Alert.alert("Can't open", "Unable to open the original link.");
    }
  };

  return (
    <View style={styles.root}>
      {/* Optional simple header (kept minimal) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Player box */}
      <View style={styles.box}>
        {!!playerHtml ? (
          <WebView
            source={{ html: playerHtml, baseUrl: playable.baseUrl }}
            style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
            userAgent={DESKTOP_UA}
            // media
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            // perf/compat
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            originWhitelist={["*"]}
            // Keep navigation inside the iframe
            onShouldStartLoadWithRequest={() => true}
            onError={() => setNote("This video may block in-app playback.")}
          />
        ) : (
          <View style={styles.center}><Text style={{ color: "#fff" }}>No video URL</Text></View>
        )}
      </View>

      {!!note && (
        <View style={styles.note}>
          <Text style={styles.noteTxt}>{note}</Text>
          <TouchableOpacity onPress={openOriginal} style={styles.openBtn}>
            <Text style={styles.openTxt}>Open in YouTube / Browser</Text>
          </TouchableOpacity>
        </View>
      )}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  note: { paddingTop: 12, alignItems: "center" },
  noteTxt: { color: "#ddd", fontSize: 13, textAlign: "center", marginBottom: 8 },
  openBtn: { backgroundColor: "#195ed2", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  openTxt: { color: "#fff", fontWeight: "700" },
});
