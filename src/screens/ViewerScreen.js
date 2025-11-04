// // // // src/screens/ViewerScreen.js
// // // import React, { useMemo } from 'react';
// // // import { View, ActivityIndicator, StyleSheet, Text, ScrollView, Dimensions } from 'react-native';
// // // import { WebView } from 'react-native-webview';
// // // import { normalizeVideoUrl } from '../utils/url';

// // // const { width } = Dimensions.get('window');
// // // const VIDEO_HEIGHT = Math.round((width - 24) * 9 / 16);

// // // function buildHtml(embedUrl) {
// // //   return `<!DOCTYPE html>
// // // <html>
// // // <head>
// // //   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
// // //   <style>
// // //     html,body{margin:0;height:100%;background:#000}
// // //     #wrap{position:fixed;inset:0}
// // //     iframe{width:100%;height:100%;border:0;background:#000}
// // //   </style>
// // // </head>
// // // <body>
// // //   <div id="wrap">
// // //     <iframe
// // //       src="${embedUrl}"
// // //       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
// // //       allowfullscreen
// // //     ></iframe>
// // //   </div>
// // // </body>
// // // </html>`;
// // // }

// // // export default function ViewerScreen({ route }) {
// // //   const { title, url, type } = route.params || {};
// // //   const norm = useMemo(() => normalizeVideoUrl(url || ''), [url]);

// // //   const isVideo = type === 'video';

// // //   // PDFs/links/etc → open directly
// // //   if (!isVideo) {
// // //     return (
// // //       <WebView
// // //         source={{ uri: norm.url || url }}
// // //         startInLoadingState
// // //         renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} />}
// // //         javaScriptEnabled
// // //         domStorageEnabled
// // //         thirdPartyCookiesEnabled
// // //         allowsFullscreenVideo
// // //         onShouldStartLoadWithRequest={() => true}
// // //       />
// // //     );
// // //   }

// // //   // Videos → 16:9 box with our iframe HTML
// // //   const html = useMemo(() => buildHtml(norm.url || url || ''), [norm.url, url]);

// // //   const stopEscapes = (req) => {
// // //     // keep YouTube inside the iframe (prevents watch/shorts redirects)
// // //     const u = req?.url || '';
// // //     if (/^intent:|^vnd\.youtube:/i.test(u)) return false;
// // //     if (/youtube\.com\/watch|youtu\.be\//i.test(u) && !/\/embed\//i.test(u)) return false;
// // //     return true;
// // //   };

// // //   return (
// // //     <ScrollView style={styles.container} contentContainerStyle={{ padding: 12 }}>
// // //       <View style={styles.videoContainer}>
// // //         <WebView
// // //           source={{ html, baseUrl: (norm.url.includes('drive.google') ? 'https://drive.google.com' : 'https://www.youtube.com') }}
// // //           style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
// // //           javaScriptEnabled
// // //           domStorageEnabled
// // //           thirdPartyCookiesEnabled
// // //           allowsFullscreenVideo
// // //           allowsInlineMediaPlayback
// // //           mediaPlaybackRequiresUserAction={false}
// // //           startInLoadingState
// // //           renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" />}
// // //           onShouldStartLoadWithRequest={stopEscapes}
// // //         />
// // //       </View>

// // //       <View style={styles.contentContainer}>
// // //         {!!title && <Text style={styles.title}>{title}</Text>}
// // //       </View>
// // //     </ScrollView>
// // //   );
// // // }

// // // const styles = StyleSheet.create({
// // //   container: { flex: 1, backgroundColor: '#fff' },
// // //   videoContainer: { height: VIDEO_HEIGHT, backgroundColor: '#000' },
// // //   contentContainer: { paddingTop: 8 },
// // //   title: { fontSize: 18, fontWeight: '800', color: '#111827' },
// // // });


// // // src/screens/ViewerScreen.js
// // // src/screens/ViewerScreen.js
// // // src/screens/ViewerScreen.js
// // // src/screens/ViewerScreen.js
// // import React, { useMemo, useState } from 'react';
// // import { View, ActivityIndicator, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity, Linking } from 'react-native';
// // import { WebView } from 'react-native-webview';

// // const { width } = Dimensions.get('window');
// // const VIDEO_H = Math.round((width - 24) * 9 / 16);
// // const DESKTOP_UA =
// //   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36';

// // function ytId(raw) {
// //   if (!raw) return '';
// //   try {
// //     let s = raw.trim();
// //     if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
// //     const u = new URL(s);
// //     const host = u.hostname.replace(/^www\./, '').toLowerCase();
// //     if (host.includes('youtu.be')) return u.pathname.slice(1);
// //     if (u.pathname.startsWith('/shorts/')) return (u.pathname.split('/')[2] || '');
// //     if (u.pathname.startsWith('/embed/')) return (u.pathname.split('/')[2] || '');
// //     if (host.includes('youtube')) return u.searchParams.get('v') || '';
// //     return '';
// //   } catch { return ''; }
// // }

// // function toPlayable(raw, type) {
// //   // Returns {mode:'yt-embed'|'yt-watch'|'drive'|'direct'|'page', url, baseUrl}
// //   if (!raw) return { mode: 'page', url: '', baseUrl: 'https://localhost' };
// //   let s = raw.trim();
// //   if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
// //   try {
// //     const u = new URL(s);
// //     const host = u.hostname.replace(/^www\./, '').toLowerCase();

// //     // YouTube
// //     if (type === 'video' && (host.includes('youtube') || host.includes('youtu.be'))) {
// //       const id = ytId(s);
// //       if (id) {
// //         const embed = `https://www.youtube.com/embed/${id}?playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&origin=https://www.youtube.com`;
// //         const watch = `https://www.youtube.com/watch?v=${id}&app=desktop`;
// //         return {
// //           mode: 'yt-embed',
// //           url: embed,
// //           baseUrl: 'https://www.youtube.com',
// //           watchUrl: watch,
// //         };
// //       }
// //       return { mode: 'page', url: s, baseUrl: u.origin };
// //     }

// //     // Google Drive (preview)
// //     if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
// //       const m = u.pathname.match(/\/file\/d\/([^/]+)/);
// //       const id = (m && m[1]) || u.searchParams.get('id') || '';
// //       if (id) {
// //         return { mode: 'drive', url: `https://drive.google.com/file/d/${id}/preview`, baseUrl: 'https://drive.google.com' };
// //       }
// //       return { mode: 'page', url: s, baseUrl: u.origin };
// //     }

// //     // Direct mp4/m3u8 → let the page handle it (or swap to react-native-video if you like)
// //     if (/\.(mp4|m4v|mov|m3u8)(\?|#|$)/i.test(s)) {
// //       return { mode: 'direct', url: s, baseUrl: u.origin };
// //     }

// //     // Anything else → open as page
// //     return { mode: 'page', url: s, baseUrl: u.origin };
// //   } catch {
// //     return { mode: 'page', url: s, baseUrl: 'https://localhost' };
// //   }
// // }

// // function htmlForIframe(embedUrl) {
// //   return `<!DOCTYPE html><html><head>
// // <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
// // <style>html,body{margin:0;height:100%;background:#000}#wrap{position:fixed;inset:0}
// // iframe{width:100%;height:100%;border:0;background:#000}</style></head>
// // <body><div id="wrap">
// // <iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
// // </div></body></html>`;
// // }

// // export default function ViewerScreen({ route }) {
// //   const { title = '', url = '', type = 'video' } = route?.params || {};
// //   const playable = useMemo(() => toPlayable(url, type), [url, type]);
// //   const [useWatchFallback, setUseWatchFallback] = useState(false);

// //   const stopYtEscapes = (req) => {
// //     const u = req?.url || '';
// //     if (/^intent:|^vnd\.youtube:/i.test(u)) return false;
// //     if (/youtube\.com\/watch|youtu\.be\//i.test(u) && !/\/embed\//i.test(u)) return false;
// //     return true;
// //   };

// //   // Non-video (PDF/links) → open as page
// //   if (type !== 'video') {
// //     return (
// //       <WebView
// //         source={{ uri: playable.url || url }}
// //         startInLoadingState
// //         renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} />}
// //         javaScriptEnabled domStorageEnabled thirdPartyCookiesEnabled
// //         allowsFullscreenVideo onShouldStartLoadWithRequest={() => true}
// //       />
// //     );
// //   }

// //   // Google Drive or YouTube EMBED
// //   const showEmbed = (playable.mode === 'drive') ||
// //     (playable.mode === 'yt-embed' && !useWatchFallback);

// //   return (
// //     <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 12 }}>
// //       <View style={{ height: VIDEO_H, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
// //         {showEmbed ? (
// //           <WebView
// //             source={{ html: htmlForIframe(playable.url), baseUrl: playable.baseUrl }}
// //             style={{ flex: 1 }}
// //             javaScriptEnabled domStorageEnabled thirdPartyCookiesEnabled
// //             allowsFullscreenVideo allowsInlineMediaPlayback
// //             startInLoadingState renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" />}
// //             onShouldStartLoadWithRequest={stopYtEscapes}
// //             onError={() => {
// //               // If YT embed fails → watch fallback inside WebView
// //               if (playable.mode === 'yt-embed') setUseWatchFallback(true);
// //             }}
// //           />
// //         ) : (
// //           // YouTube watch-page fallback (still inside your app)
// //           <WebView
// //             source={{ uri: playable.watchUrl }}
// //             style={{ flex: 1 }}
// //             userAgent={DESKTOP_UA}
// //             javaScriptEnabled domStorageEnabled thirdPartyCookiesEnabled
// //             allowsFullscreenVideo
// //             startInLoadingState renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" />}
// //           />
// //         )}
// //       </View>

// //       {!!(playable.mode === 'yt-embed' && useWatchFallback) && (
// //         <View style={{ paddingTop: 12, gap: 8 }}>
// //           <Text style={{ color: '#333' }}>
// //             This video’s owner blocks the embedded player. Showing the YouTube page inside the app.
// //           </Text>
// //           <TouchableOpacity
// //             onPress={() => Linking.openURL(url)}
// //             style={{ alignSelf: 'flex-start', backgroundColor: '#195ed2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}>
// //             <Text style={{ color: '#fff', fontWeight: '700' }}>Open in YouTube app / browser</Text>
// //           </TouchableOpacity>
// //         </View>
// //       )}

// //       {!!title && <Text style={{ marginTop: 8, fontSize: 18, fontWeight: '800', color: '#111827' }}>{title}</Text>}
// //     </ScrollView>
// //   );
// // }
// // src/screens/ViewerScreen.js

// import React, { useMemo } from 'react';
// import {
//   View, ActivityIndicator, StyleSheet, Text, ScrollView,
//   Dimensions, TouchableOpacity, Linking
// } from 'react-native';
// import { WebView } from 'react-native-webview';

// const { width } = Dimensions.get('window');
// const VIDEO_H = Math.round((width - 24) * 9 / 16);

// /** Extract a single YouTube id from any watch/shorts/youtu.be/embed URL */
// function ytId(raw) {
//   if (!raw) return '';
//   try {
//     let s = raw.trim();
//     if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
//     const u = new URL(s);
//     const host = u.hostname.replace(/^www\./, '').toLowerCase();

//     if (host.includes('youtu.be')) return u.pathname.slice(1);
//     if (u.pathname.startsWith('/shorts/')) return (u.pathname.split('/')[2] || '');
//     if (u.pathname.startsWith('/embed/')) return (u.pathname.split('/')[2] || '');
//     if (host.includes('youtube')) return u.searchParams.get('v') || '';
//     return '';
//   } catch { return ''; }
// }

// /** Simple HTML shell that shows only the iframe content, full-bleed */
// function htmlIframe(src) {
//   return `<!doctype html><html><head>
// <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
// <style>
//   html,body{margin:0;height:100%;background:#000}
//   #wrap{position:fixed;inset:0}
//   iframe{width:100%;height:100%;border:0;background:#000}
// </style></head>
// <body>
//   <div id="wrap">
//     <iframe
//       src="${src}"
//       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//       allowfullscreen
//       referrerpolicy="no-referrer-when-downgrade">
//     </iframe>
//   </div>
// </body></html>`;
// }

// /** Decide how to render the given URL */
// function toPlayable(raw, type) {
//   if (!raw) return { mode: 'page', url: '', baseUrl: 'https://localhost' };
//   let s = raw.trim();
//   if (!/^https?:\/\//i.test(s)) s = `https://${s}`;

//   try {
//     const u = new URL(s);
//     const host = u.hostname.replace(/^www\./, '').toLowerCase();

//     // --- YouTube -> EMBED (clean, no page chrome) ---
//     if (type === 'video' && (host.includes('youtube') || host.includes('youtu.be'))) {
//       const id = ytId(s);
//       if (id) {
//         // Use the privacy-enhanced domain and minimal UI params
//         const embed = `https://www.youtube-nocookie.com/embed/${id}` +
//           `?playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1&autohide=1&showinfo=0&controls=1`;
//         return { mode: 'yt-embed', url: embed, baseUrl: 'https://www.youtube-nocookie.com' };
//       }
//       return { mode: 'page', url: s, baseUrl: u.origin };
//     }

//     // --- Google Drive -> /preview ---
//     if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
//       const m = u.pathname.match(/\/file\/d\/([^/]+)/);
//       const id = (m && m[1]) || u.searchParams.get('id') || '';
//       if (id) {
//         return {
//           mode: 'drive',
//           url: `https://drive.google.com/file/d/${id}/preview`,
//           baseUrl: 'https://drive.google.com'
//         };
//       }
//       return { mode: 'page', url: s, baseUrl: u.origin };
//     }

//     // --- Direct video files -> load page directly ---
//     if (/\.(mp4|m4v|mov|m3u8)(\?|#|$)/i.test(s)) {
//       return { mode: 'page', url: s, baseUrl: u.origin };
//     }

//     // --- Everything else as a regular page (pdfs, sites, etc.) ---
//     return { mode: 'page', url: s, baseUrl: u.origin };
//   } catch {
//     return { mode: 'page', url: s, baseUrl: 'https://localhost' };
//   }
// }

// export default function ViewerScreen({ route }) {
//   const { title = '', url = '', type = 'video' } = route?.params || {};
//   const playable = useMemo(() => toPlayable(url, type), [url, type]);

//   // Non-video -> open the page directly (pdfs, docs, sites)
//   if (type !== 'video') {
//     return (
//       <WebView
//         source={{ uri: playable.url || url }}
//         startInLoadingState
//         renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} />}
//         javaScriptEnabled
//         domStorageEnabled
//         thirdPartyCookiesEnabled
//         allowsFullscreenVideo
//         onShouldStartLoadWithRequest={() => true}
//         setSupportMultipleWindows={false}
//       />
//     );
//   }

//   const isDrive = playable.mode === 'drive';
//   const isYtEmbed = playable.mode === 'yt-embed';

//   return (
//     <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 12 }}>
//       <View style={{ height: VIDEO_H, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
//         {(isDrive || isYtEmbed) ? (
//           <WebView
//             source={{ html: htmlIframe(playable.url), baseUrl: playable.baseUrl }}
//             style={{ flex: 1 }}
//             javaScriptEnabled
//             domStorageEnabled
//             thirdPartyCookiesEnabled
//             allowsFullscreenVideo
//             allowsInlineMediaPlayback
//             startInLoadingState
//             renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" />}
//             setSupportMultipleWindows={false}
//             onShouldStartLoadWithRequest={(req) => {
//               // prevent external YouTube app or intent:// hijacks
//               const u = req?.url || '';
//               if (/^intent:|^vnd\.youtube:/i.test(u)) return false;
//               return true;
//             }}
//           />
//         ) : (
//           // Fallback: just load whatever it is as a page
//           <WebView
//             source={{ uri: playable.url || url }}
//             style={{ flex: 1 }}
//             javaScriptEnabled
//             domStorageEnabled
//             thirdPartyCookiesEnabled
//             allowsFullscreenVideo
//             allowsInlineMediaPlayback
//             startInLoadingState
//             renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" />}
//             setSupportMultipleWindows={false}
//             onShouldStartLoadWithRequest={(req) => {
//               const u = req?.url || '';
//               if (/^intent:|^vnd\.youtube:/i.test(u)) return false;
//               return true;
//             }}
//           />
//         )}
//       </View>

//       {!!title && <Text style={styles.title}>{title}</Text>}

//       {/* <TouchableOpacity onPress={() => Linking.openURL(url)} style={styles.openBtn}>
//         <Text style={styles.openTxt}>Open in YouTube / Browser</Text>
//       </TouchableOpacity> */}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   title: { marginTop: 8, fontSize: 18, fontWeight: '800', color: '#111827' },
//   openBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#195ed2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
//   openTxt: { color: '#fff', fontWeight: '700' },
// });





import React, { useMemo, useState } from 'react';
import {
  View, ActivityIndicator, StyleSheet, Text, ScrollView,
  Dimensions, TouchableOpacity, Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import Video from 'react-native-video';

const { width } = Dimensions.get('window');
const VIDEO_H = Math.round((width - 24) * 9 / 16);

function ytId(raw) {
  if (!raw) return '';
  try {
    let s = raw.trim();
    if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('youtu.be')) return u.pathname.slice(1);
    if (u.pathname.startsWith('/shorts/')) return (u.pathname.split('/')[2] || '');
    if (u.pathname.startsWith('/embed/')) return (u.pathname.split('/')[2] || '');
    if (host.includes('youtube')) return u.searchParams.get('v') || '';
    return '';
  } catch { return ''; }
}

function htmlIframe(src) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>html,body{margin:0;height:100%;background:#000}#wrap{position:fixed;inset:0}
iframe{width:100%;height:100%;border:0;background:#000}</style></head>
<body><div id="wrap">
<iframe src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
</div></body></html>`;
}

function toPlayable(raw, type) {
  if (!raw) return { mode: 'page', url: '', baseUrl: 'https://localhost' };
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;

  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    // YouTube -> embed
    if (type === 'video' && (host.includes('youtube') || host.includes('youtu.be'))) {
      const id = ytId(s);
      if (id) {
        const embed = `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1&autohide=1&showinfo=0&controls=1`;
        return { mode: 'yt-embed', url: embed, baseUrl: 'https://www.youtube-nocookie.com' };
      }
      return { mode: 'page', url: s, baseUrl: u.origin };
    }

    // Google Drive -> prefer DIRECT file for native player
    if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = (m && m[1]) || u.searchParams.get('id') || '';
      if (id) {
        const direct = `https://drive.google.com/uc?export=download&id=${id}`;
        const preview = `https://drive.google.com/file/d/${id}/preview`;
        return { mode: 'drive-native', url: direct, preview, baseUrl: 'https://drive.google.com' };
      }
      return { mode: 'page', url: s, baseUrl: u.origin };
    }

    if (/\.(mp4|m4v|mov|m3u8)(\?|#|$)/i.test(s)) {
      return { mode: 'direct', url: s, baseUrl: u.origin };
    }

    return { mode: 'page', url: s, baseUrl: u.origin };
  } catch {
    return { mode: 'page', url: s, baseUrl: 'https://localhost' };
  }
}

export default function ViewerScreen({ route }) {
  const { title = '', url = '', type = 'video' } = route?.params || {};
  const playable = useMemo(() => toPlayable(url, type), [url, type]);
  const [driveFallback, setDriveFallback] = useState(false); // switch to /preview if direct stream fails

  if (type !== 'video') {
    return (
      <WebView
        source={{ uri: playable.url || url }}
        startInLoadingState
        renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} />}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        allowsFullscreenVideo
        onShouldStartLoadWithRequest={() => true}
        setSupportMultipleWindows={false}
      />
    );
  }

  const isDriveNative = playable.mode === 'drive-native' && !driveFallback;
  const isDrivePreview = playable.mode === 'drive-native' && driveFallback;
  const isYtEmbed = playable.mode === 'yt-embed';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 12 }}>
      <View style={styles.playerBox}>
        {isDriveNative ? (
          <Video
            source={{ uri: playable.url }}
            style={styles.playerSurface}              // ⬅️ use this style
            resizeMode="contain"
            controls
            paused={false}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
            onBuffer={({ isBuffering }) => setLoading(isBuffering)}
            onReadyForDisplay={() => setLoading(false)}
            onError={() => {
              setDriveFallback(true);
              setLoading(true);
            }}
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000,
            }}
          />
        ) : isDrivePreview ? (
          <WebView
            source={{ html: htmlIframe(playable.preview), baseUrl: playable.baseUrl }}
            style={styles.playerSurface}              // ⬅️ use this style
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            renderLoading={() => null}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
          />
        ) : isYtEmbed ? (
          <WebView
            source={{ html: htmlIframe(playable.url), baseUrl: playable.baseUrl }}
            style={styles.playerSurface}              // ⬅️ use this style
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            renderLoading={() => null}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(req) => {
              const u = req?.url || '';
              if (/^intent:|^vnd\.youtube:/i.test(u)) return false;
              if (/youtube\.com\/watch|youtu\.be\//i.test(u) && !/\/embed\//i.test(u)) return false;
              return true;
            }}
            onError={() => setLoading(false)}
            androidLayerType="hardware"
          />
        ) : (
          <WebView
            source={{ uri: playable.url || url }}
            style={styles.playerSurface}              // ⬅️ use this style
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            renderLoading={() => null}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
          />
        )}

        {/* 👇 Put overlay LAST so it sits on top */}
        {loading && (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingTxt}>Loading video…</Text>
          </View>
        )}
      </View>


      {!!title && <Text style={styles.title}>{title}</Text>}

      {/* <TouchableOpacity onPress={() => Linking.openURL(url)} style={styles.openBtn}>
        <Text style={styles.openTxt}>Open in YouTube / Browser</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 8, fontSize: 18, fontWeight: '800', color: '#111827' },
  openBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#195ed2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  openTxt: { color: '#fff', fontWeight: '700' },

  playerBox: {
    height: VIDEO_H,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',     // ⬅️ important for absolute overlay
  },
  // Surface for WebView/Video so they sit *below* the overlay
  playerSurface: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,                // ⬅️ explicitly below overlay
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 100,              // ⬅️ on top
    elevation: 100,           // ⬅️ Android stacking
  },
  loadingTxt: { color: '#fff', fontWeight: '600', marginTop: 8 },


});
