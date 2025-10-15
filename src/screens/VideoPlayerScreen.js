import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');
const VIDEO_H = ((width - 24) * 9) / 16;

const toEmbed = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const url = raw.trim();
  try {
    const u = new URL(url);
    const host = u.host || '';
    // YouTube
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let id = '';
      if (host.includes('youtu.be')) id = u.pathname.replace('/', '');
      else id = u.searchParams.get('v');
      return `https://www.youtube.com/embed/${id}`;
    }
    // Google Drive
    if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m ? m[1] : u.searchParams.get('id');
      return `https://drive.google.com/file/d/${id}/preview`;
    }
    return url; // fallback (direct mp4, etc.)
  } catch {
    return url;
  }
};

export default function VideoPlayerScreen({ route }) {
  const { video } = route.params || {};
  const src = useMemo(() => toEmbed(video?.url || video?.link || ''), [video]);

  return (
    <View style={s.wrap}>
      <WebView
        source={{ uri: src }}
        style={{ height: VIDEO_H, width: width - 24, borderRadius: 12, overflow: 'hidden' }}
        allowsFullscreenVideo
        javaScriptEnabled
        startInLoadingState
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 12, backgroundColor: '#f4f7fb' },
});
