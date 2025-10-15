// src/screens/ViewerScreen.js
import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// Build a safe embed URL for YT/Drive/PDF/basic links
function toEmbedUrl({ url, type, embedUrl }) {
  if (embedUrl) return embedUrl;

  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    // YouTube -> /embed/{id}
    if (type === 'video' && (host.includes('youtube.com') || host.includes('youtu.be'))) {
      let id = '';
      if (host.includes('youtu.be')) id = u.pathname.slice(1);
      else id = u.searchParams.get('v') || '';
      if (!id) {
        const m = u.pathname.match(/\/embed\/([^/]+)/);
        if (m) id = m[1];
      }
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1`;
    }

    // Drive file preview
    if (host.includes('drive.google.com')) {
      const m = url.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1];
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
      return url;
    }

    // PDF direct -> Google viewer (keeps it in-app)
    if (type === 'pdf' || url.toLowerCase().endsWith('.pdf')) {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
    }

    return url;
  } catch {
    return url;
  }
}

export default function ViewerScreen({ route }) {
  const { title, url, type, embedUrl } = route.params || {};
  const src = useMemo(() => toEmbedUrl({ url, type, embedUrl }), [url, type, embedUrl]);

  // header title is set from navigator options in App.tsx

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: src }}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
