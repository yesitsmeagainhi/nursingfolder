// src/screens/ViewerScreen.js
import React, { useMemo } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  ScrollView,
  Dimensions, // Import Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';

// Get the screen width to calculate video height
const { width } = Dimensions.get('window');
// Calculate height for a 16:9 aspect ratio video
const VIDEO_HEIGHT = (width * 9) / 16;

// This function correctly finds the embeddable URL (no changes needed)
function toEmbedUrl({ url, type, embedUrl }) {
  if (embedUrl) return embedUrl;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
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
    if (host.includes('drive.google.com')) {
      const m = url.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1];
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
      return url;
    }
    if (type === 'pdf' || url.toLowerCase().endsWith('.pdf')) {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
    }
    return url;
  } catch {
    return url;
  }
}

// This HTML wrapper is still perfect for making the video fill its container
const createVideoHtml = (embedUrl) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #000; }
        iframe { width: 100%; height: 100%; border: 0; }
      </style>
    </head>
    <body>
      <iframe
        src="${embedUrl}"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen
      ></iframe>
    </body>
  </html>
`;

export default function ViewerScreen({ route }) {
  const { title, url, type, embedUrl } = route.params || {};
  const src = useMemo(() => toEmbedUrl({ url, type, embedUrl }), [url, type, embedUrl]);

  const isVideo = type === 'video';

  // For non-video content, we'll still use the full-screen WebView
  if (!isVideo) {
    return (
      <WebView
        source={{ uri: src }}
        startInLoadingState
        renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} />}
      />
    );
  }

  // --- NEW LAYOUT FOR VIDEOS ---
  return (
    <ScrollView style={styles.container}>
      {/* Video Player Area */}
      <View style={styles.videoContainer}>
        <WebView
          source={{ html: createVideoHtml(src) }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          // This prop is key: it allows the YouTube player's fullscreen button to work
          allowsFullscreenVideo={true} 
          onError={(event) => alert(`WebView Error: ${event.nativeEvent.description}`)}
        />
      </View>

      {/* Content Area Below Video */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoContainer: {
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    marginTop: 12,
    lineHeight: 22,
  },
});