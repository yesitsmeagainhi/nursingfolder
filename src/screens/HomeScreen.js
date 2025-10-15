import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { THEME } from '../utils/map';
import { currentUser, signOut } from '../services/authService';
import ListItem from '../components/ListItem';

const HeaderCard = ({ title, subtitle, icon, onPress }) => (
  <TouchableOpacity style={s.card} activeOpacity={0.9} onPress={onPress}>
    <Icon name={icon} size={26} color={THEME} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={s.cardTitle}>{title}</Text>
      {!!subtitle && <Text style={s.cardSub}>{subtitle}</Text>}
    </View>
    <Icon name="chevron-right" size={22} color="#9ca3af" />
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const user = currentUser();

  const [loading, setLoading] = useState(true);
  const [firstFolder, setFirstFolder] = useState(null);
  const [err, setErr] = useState(null);

  // Load FIRST root folder (parentId == null) ordered by `order`
  useEffect(() => {
    const q = firestore()
      .collection('nodes')
      .where('parentId', '==', null)
      .orderBy('order', 'asc');

    const unsub = q.onSnapshot(
      snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data()) }));
        // pick first item that is a folder
        const folder = items.find(x => x.type === 'folder') || null;
        setFirstFolder(folder);
        setLoading(false);
      },
      e => {
        setErr(e?.message || 'Failed to load');
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, []);

  const openRootExplorer = () => navigation.navigate('Explorer');
  const openFirstFolder = () => {
    if (!firstFolder) return;
    navigation.navigate('Explorer', {
      openFolderId: firstFolder.id,
      openFolderName: firstFolder.name,
    });
  };

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16 }}>
      <StatusBar barStyle="dark-content" />
      <Text style={s.hi}>Hello{user?.email ? `, ${user.email}` : ''} 👋</Text>
      <Text style={s.h2}>What would you like to do?</Text>

      <HeaderCard
        icon="folder-open-outline"
        title="Explore Content"
        subtitle="Browse everything from Root"
        onPress={openRootExplorer}
      />

      <View style={{ marginTop: 8 }}>
        <Text style={s.section}>Your first course</Text>

        {loading ? (
          <View style={s.rowCenter}>
            <ActivityIndicator />
            <Text style={{ marginLeft: 8, color: '#6b7280' }}>Loading…</Text>
          </View>
        ) : err ? (
          <Text style={{ color: '#ef4444' }}>{err}</Text>
        ) : firstFolder ? (
          <HeaderCard
            icon="book-open-variant"
            title={firstFolder.name}
            subtitle="Tap to open this course"
            onPress={openFirstFolder}
          />
        ) : (
          <HeaderCard
            icon="plus-box-outline"
            title="No course found"
            subtitle="Create your first folder from Explorer"
            onPress={openRootExplorer}
          />
        )}
      </View>

      {/* Example: continue watching stub */}
      <ListItem
        icon="play-circle-outline"
        title="Continue Watching"
        subtitle="Jump back to the last video"
        onPress={openRootExplorer}
        right={<Icon name="chevron-right" size={20} color="#9ca3af" />}
      />

      <TouchableOpacity
        style={s.logout}
        onPress={async () => { await signOut(); navigation.replace('Login'); }}
      >
        <Icon name="logout" size={18} color="#ef4444" />
        <Text style={s.logoutTxt}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f4f7fb' },
  hi: { fontSize: 22, fontWeight: '800', color: '#111827' },
  h2: { marginTop: 6, marginBottom: 16, color: '#6b7280' },
  section: { marginBottom: 6, fontWeight: '700', color: '#111827' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardSub: { color: '#6b7280', marginTop: 3 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  logout: { marginTop: 22, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  logoutTxt: { marginLeft: 8, color: '#ef4444', fontWeight: '700' },
});
