import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ListItem from '../components/ListItem';

export default function ExplorerScreen({ route, navigation }) {
  const [stack, setStack] = useState([{ id: null, name: 'Root' }]);
  const current = stack[stack.length - 1];

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const id = route?.params?.openFolderId;
    const name = route?.params?.openFolderName;
    if (id && name) {
      setStack([{ id: null, name: 'Root' }, { id, name }]);
    }
  }, [route?.params]);

  useEffect(() => {
    setLoading(true);
    const q = firestore()
      .collection('nodes')
      .where('parentId', '==', current.id)
      .orderBy('order', 'asc');

    const unsub = q.onSnapshot(
      snap => {
        let items = snap.docs.map(d => ({ id: d.id, ...(d.data()) }));
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

  // --- THIS FUNCTION IS THE FIX ---
const goBack = () => navigation.navigate('Home');   // or navigation.popToTop()
  
  const openItemInApp = (item) => {
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
      <ListItem
        icon={iconName}
        title={item.name}
        subtitle={`${item.type.toUpperCase()} • order ${item.order ?? 0}`}
        onPress={() => (isFolder ? enterFolder(item) : openItemInApp(item))}
        right={isFolder ? null : <Icon name="chevron-right" size={20} color="#9ca3af" />}
      />
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        {/* The back button is now always visible on this screen */}
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{current.name}</Text>
      </View>

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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
});