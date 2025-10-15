// src/screens/ExplorerScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ListItem from '../components/ListItem';
import { THEME } from '../utils/map';

export default function ExplorerScreen({ route, navigation }) {
  // Breadcrumb stack → default Root
  const [stack, setStack] = useState([{ id: null, name: 'Root' }]);
  const current = stack[stack.length - 1];

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // If Home sent a folder: start inside it
  useEffect(() => {
    const id = route?.params?.openFolderId;
    const name = route?.params?.openFolderName;
    if (id && name) {
      setStack([{ id: null, name: 'Root' }, { id, name }]);
    }
  }, [route?.params]);

  // Load children for current folder
  useEffect(() => {
    setLoading(true);
    const q = firestore()
      .collection('nodes')
      .where('parentId', '==', current.id) // null for root
      .orderBy('order', 'asc');

    const unsub = q.onSnapshot(
      snap => {
        let items = snap.docs.map(d => ({ id: d.id, ...(d.data()) }));
        // stable secondary sort by name (client-side)
        items = items.sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
          return String(a.name || '').localeCompare(String(b.name || ''));
        });
        setRows(items);
        setLoading(false);
      },
      e => {
        console.warn('Explorer load error:', e);
        setRows([]);
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, [current?.id]);

  const enterFolder = (item) => {
    setStack(prev => [...prev, { id: item.id, name: item.name }]);
  };

  const goUpTo = (targetId) => {
    const idx = stack.findIndex(s => s.id === targetId);
    if (idx >= 0) setStack(stack.slice(0, idx + 1));
    else setStack([{ id: null, name: 'Root' }]);
  };

  const openItemInApp = (item) => {
    // Route all non-folder items to in-app WebView
    navigation.navigate('Viewer', {
      title: item.name,
      type: item.type,
      url: item.url,
      embedUrl: item.embedUrl,
    });
  };

  const renderItem = ({ item }) => {
    const isFolder = item.type === 'folder';
    const iconName =
      isFolder ? 'folder' :
      item.type === 'video' ? 'play-circle-outline' :
      item.type === 'pdf' ? 'file-pdf-box' : 'link-variant';

    return (
      <View style={styles.rowWrap}>
        <View style={[
          styles.thumb,
          isFolder && { backgroundColor: '#fde68a' }, // light yellow for folders
        ]}>
          <Icon
            name={iconName}
            size={22}
            color={isFolder ? '#d97706' : '#374151'} // darker for folder, neutral for others
          />
        </View>

        <ListItem
          // Your ListItem likely ignores the thumb; if so, you can remove View above and
          // pass icon via ListItem's icon prop. Keeping both for clarity.
          icon={iconName}
          title={item.name}
          subtitle={`${item.type.toUpperCase()} • order ${item.order ?? 0}`}
          onPress={() => (isFolder ? enterFolder(item) : openItemInApp(item))}
          right={<Icon name="chevron-right" size={20} color="#9ca3af" />}
          style={{ flex: 1 }}
        />
      </View>
    );
  };

  const Breadcrumbs = useMemo(() => (
    <View style={styles.breadcrumb}>
      {stack.map((c, i) => (
        <View key={`${c.id ?? 'root'}-${i}`} style={styles.bcRow}>
          <TouchableOpacity onPress={() => goUpTo(c.id)}>
            <Text style={styles.bcLink}>{c.name}</Text>
          </TouchableOpacity>
          {i < stack.length - 1 && <Text style={styles.bcSep}> / </Text>}
        </View>
      ))}
    </View>
  ), [stack]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
      </View>

      {Breadcrumbs}

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
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  breadcrumb: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 8 },
  bcRow: { flexDirection: 'row', alignItems: 'center' },
  bcLink: { color: THEME, fontWeight: '700', paddingVertical: 6 },
  bcSep: { color: '#9ca3af', marginHorizontal: 4 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 24 },
  rowWrap: { flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 36, height: 36, borderRadius: 8, marginLeft: 12, marginRight: 8,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb',
  },
});
