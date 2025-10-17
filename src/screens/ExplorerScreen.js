// src/screens/ExplorerScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ExplorerScreen({ route, navigation }) {
  // Current folder context (null => root)
  const currentId = route?.params?.openFolderId ?? null;
  const currentName = route?.params?.openFolderName ?? 'Root';

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Set the header title to current folder name
  useEffect(() => {
    navigation.setOptions({ title: currentName });
  }, [currentName, navigation]);

  // Subscribe to children of the current folder
  useEffect(() => {
    setLoading(true);

    const col = firestore().collection('nodes');

    // If we're at root, match parentId == null OR parentRef == null
    const isRoot = currentId == null;

    // Q1: string parentId
    const q1 = col
      .where('parentId', '==', isRoot ? null : currentId)
      .orderBy('order', 'asc');

    // Q2: DocumentReference parentRef
    const parentRef = isRoot ? null : col.doc(currentId);
    const q2 = col
      .where('parentRef', '==', isRoot ? null : parentRef)
      .orderBy('order', 'asc');

    let a = [];
    let b = [];
    const unsubs = [];

    const mapSnap = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const apply = () => {
      // merge + de-dupe by id
      const byId = new Map();
      [...a, ...b].forEach((x) => byId.set(x.id, x));
      let items = Array.from(byId.values());

      // Stable sort: order asc, then name asc
      items = items.sort((x, y) => {
        const ox = x.order ?? 0;
        const oy = y.order ?? 0;
        if (ox !== oy) return ox - oy;
        return String(x.name || '').localeCompare(String(y.name || ''));
      });

      setRows(items);
      setLoading(false);
    };

    const u1 = q1.onSnapshot(
      (s) => {
        a = mapSnap(s);
        apply();
      },
      (e) => {
        console.warn('Explorer q1 error:', e);
        setLoading(false);
      }
    );

    const u2 = q2.onSnapshot(
      (s) => {
        b = mapSnap(s);
        apply();
      },
      (e) => {
        console.warn('Explorer q2 error:', e);
        setLoading(false);
      }
    );

    unsubs.push(u1, u2);
    return () => unsubs.forEach((fn) => fn && fn());
  }, [currentId]);

  // Open folder or file
  const openItem = useCallback(
    (item) => {
      if (item.type === 'folder') {
        // Drill-down: push another Explorer for the subfolder
        navigation.push('Explorer', {
          openFolderId: item.id,
          openFolderName: item.name,
        });
      } else {
        // Leaf: hand off to Viewer (it can fetch by nodeId and decide how to render)
        navigation.push('Viewer', {
          nodeId: item.id, title: item.name, type: item.type,
          url: item.url,
          embedUrl: item.embedUrl,
        });
      }
    },
    [navigation]
  );

  const renderItem = ({ item }) => {
    const isFolder = item.type === 'folder';
    const iconName = isFolder
      ? 'folder'
      : item.type === 'video'
        ? 'play-circle-outline'
        : item.type === 'pdf'
          ? 'file-pdf-box'
          : 'link-variant';

    return (
      <TouchableOpacity style={styles.row} onPress={() => openItem(item)}>
        <Icon name={iconName} size={22} color="#6b7280" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.sub}>{(item.type || '').toUpperCase()}</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Icon name="folder-outline" size={42} color="#9ca3af" />
          <Text style={{ marginTop: 8, color: '#6b7280' }}>No items here yet.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
});
