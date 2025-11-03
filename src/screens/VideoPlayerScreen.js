// src/screens/VideoPlayerScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Text, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import Video from 'react-native-video';
import firestore from '@react-native-firebase/firestore';
import { resolvePlayable } from '../utils/resolvePlayable';

const { width } = Dimensions.get('window');
const W = width - 24;
const H = (W * 9) / 16;

export default function VideoPlayerScreen({ route }) {
  const { url, embedUrl, nodeId, video } = route?.params || {};
  const initial = embedUrl || url || (video && (video.url || video.link)) || '';
  const [link, setLink] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState('');
  const [err, setErr] = useState('');

  // Fetch by nodeId if needed
  useEffect(() => {
    let on = true;
    (async () => {
      if (!initial && nodeId) {
        try {
          setLoading(true);
          const snap = await firestore().collection('nodes').doc(String(nodeId)).get();
          const d = snap.data() || {};
          const u = d.embedUrl || d.url || '';
          if (on) setLink(u);
        } catch { if (on) setErr('Could not load video info'); }
        finally { if (on) setLoading(false); }
      }
    })();
    return () => { on = false; };
  }, [nodeId, initial]);

  const plan = useMemo(() => resolvePlayable(link), [link]);

  const openExternally = useCallback(() => {
    if (plan?.src) Linking.openURL(plan.src).catch(() => { });
  }, [plan]);

  if (loading) {
    return <View style={[s.wrap, s.center]}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  // YOUTUBE
  if (plan.renderer === 'youtube') {
    // react-native-youtube-iframe needs the *id*, not the full embed URL
    // We extract again from plan.src
    const id = (plan.src.match(/\/embed\/([^/?]+)/) || [])[1];
    return (
      <View style={[s.wrap, s.center]}>
        <View style={s.box}>
          <YoutubePlayer height={H} width={W} play={false} videoId={id} onError={() => setBlocked('Embedding disabled by owner')} />
        </View>
        {!!blocked && <Blocked reason={blocked} onOpen={openExternally} />}
      </View>
    );
  }

  // NATIVE (direct mp4/m3u8)
  if (plan.renderer === 'native') {
    return (
      <View style={[s.wrap, s.center]}>
        <View style={s.box}>
          <Video
            source={{ uri: plan.src }}
            style={{ width: W, height: H, backgroundColor: '#000' }}
            controls
            resizeMode="contain"
            onError={() => setErr('Failed to load the video stream')}
            bufferConfig={{ minBufferMs: 15000, maxBufferMs: 50000, bufferForPlaybackMs: 2500, bufferForPlaybackAfterRebufferMs: 5000 }}
          />
        </View>
        {!!err && <Blocked reason={err} onOpen={openExternally} />}
      </View>
    );
  }

  // EXTERNAL ONLY
  if (plan.renderer === 'external') {
    return (
      <View style={[s.wrap, s.center]}>
        <Blocked reason="This provider doesn’t allow embedding." onOpen={openExternally} />
      </View>
    );
  }

  // WEB (iframe in WebView) — Drive/Vimeo/Unknown
  const html = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>html,body{margin:0;background:#000;height:100%} .wrap{position:fixed;inset:0} iframe{width:100%;height:100%;border:0;border-radius:12px;}</style>
</head><body><div class="wrap">
<iframe src="${plan.src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div></body></html>`;

  const blockRedirects = (req) => {
    const u = req?.url || '';
    // don’t let YouTube watch/shorts escape the iframe
    if (/^intent:|^vnd\.youtube:/i.test(u)) return false;
    if (/youtube\.com\/watch|youtu\.be\//i.test(u) && !/\/embed\//i.test(u)) return false;
    return true;
  };

  return (
    <View style={[s.wrap, s.center]}>
      <View style={s.box}>
        <WebView
          source={{ html, baseUrl: 'https://localhost' }}
          style={{ width: W, height: H, borderRadius: 12, overflow: 'hidden' }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mixedContentMode="always"
          onError={() => setBlocked('Provider blocked embedding or network issue')}
          onShouldStartLoadWithRequest={blockRedirects}
        />
      </View>
      {!!blocked && <Blocked reason={blocked} onOpen={openExternally} />}
    </View>
  );
}

function Blocked({ reason, onOpen }) {
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Can’t play inline</Text>
      <Text style={{ color: '#bbb', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{reason}</Text>
      <TouchableOpacity onPress={onOpen} style={{ backgroundColor: '#195ed2', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Open in App/Browser</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000', padding: 12 },
  center: { alignItems: 'center', justifyContent: 'center' },
  box: { width: W, height: H, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
});
