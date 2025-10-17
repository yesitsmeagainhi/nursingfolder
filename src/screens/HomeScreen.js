// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  ActivityIndicator, TextInput, ImageBackground, FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import Fuse from 'fuse.js';
// Build a quick lookup for parent names

const PopularCourseCard = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.popularCard}>
    <ImageBackground
      source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070' }}
      style={styles.popularCardImage}
      imageStyle={{ borderRadius: 16 }}
    >
      <View style={styles.popularCardOverlay} />
      <Text style={styles.popularCardTitle}>{item.name}</Text>
    </ImageBackground>
  </TouchableOpacity>
);

const SearchResultCard = ({ item, subtitle, onPress }) => {
  const iconName =
    item.type === 'folder' ? 'folder-outline' :
      item.type === 'video' ? 'play-circle-outline' :
        item.type === 'pdf' ? 'file-pdf-box' :
          'file-document-outline';
  return (
    <TouchableOpacity style={styles.searchCard} onPress={onPress}>
      <Icon name={iconName} size={32} color="#581c87" />
      <Text style={styles.searchCardTitle} numberOfLines={2}>{item.name}</Text>
      {subtitle ? <Text style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }} numberOfLines={1}>{subtitle}</Text> : null}

    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [featuredCourse, setFeaturedCourse] = useState(null);
  const [popularCourses, setPopularCourses] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // local cache for fuzzy/substring search
  const [allNodes, setAllNodes] = useState([]);
  const [fuse, setFuse] = useState(null);
  const parentNameById = new Map(allNodes.map(n => [n.id, n.name]));

  // Load root folders (featured + popular)
  useEffect(() => {
    const q = firestore()
      .collection('nodes')
      .where('parentId', '==', null)
      .where('type', '==', 'folder')
      .orderBy('order', 'asc');

    const unsub = q.onSnapshot(
      snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const featured = items.find(i => i.order === 1) || items[0] || null;
        const popular = items.filter(i => i.id !== featured?.id);
        setFeaturedCourse(featured);
        setPopularCourses(popular);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub && unsub();
  }, []);

  // Build a local index (Fuse) so we can substring/typo search without schema changes
  useEffect(() => {
    const unsub = firestore().collection('nodes').onSnapshot(snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllNodes(arr);
      setFuse(new Fuse(arr, {
        keys: ['name'],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }));
    });
    return () => unsub && unsub();
  }, []);

  // Helper: Firestore prefix query if you happen to have name_lc/name_lowercase
  const prefixQueryOn = async (field, term, limit = 40) => {
    try {
      const s = await firestore()
        .collection('nodes')
        .where(field, '>=', term)
        .where(field, '<', term + '\uf8ff') // IMPORTANT: '<' upper bound
        .orderBy(field, 'asc')
        .limit(limit)
        .get();
      return s.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  };

  // Unified search: prefix (both fields) + Fuse + substring
  const runSearch = async (raw) => {
    const term = (raw || '').trim().toLowerCase();
    if (term.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const [a, b] = await Promise.allSettled([
        prefixQueryOn('name_lc', term, 60),
        prefixQueryOn('name_lowercase', term, 60),
      ]);
      const fromPrefix = [
        ...(a.status === 'fulfilled' ? a.value : []),
        ...(b.status === 'fulfilled' ? b.value : []),
      ];

      const fromFuse = fuse ? fuse.search(term).slice(0, 60).map(h => h.item) : [];

      const fromIncludes = allNodes.filter(
        n => typeof n.name === 'string' && n.name.toLowerCase().includes(term)
      );

      const map = new Map();
      [...fromPrefix, ...fromFuse, ...fromIncludes].forEach(x => map.set(x.id, x));
      const merged = Array.from(map.values()).sort((x, y) => {
        const xf = x.type === 'folder' ? 0 : 1;
        const yf = y.type === 'folder' ? 0 : 1;
        if (xf !== yf) return xf - yf;
        return String(x.name || '').localeCompare(String(y.name || ''));
      });

      setSearchResults(merged);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce typing → runSearch
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        runSearch(searchQuery);
      } else {
        setShowSearchResults(false);
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, fuse, allNodes]);

  // Navigation
  const onItemPress = (item) => {
    if (item.type === 'folder') {
      navigation.push('Explorer', { openFolderId: item.id, openFolderName: item.name });
    } else {
      navigation.push('Viewer', {
        nodeId: item.id,
        title: item.name,
        type: item.type,
        url: item.url || item.meta?.videoUrl || item.meta?.pdfUrl || null,
        embedUrl: item.embedUrl || item.meta?.embedUrl || null,
      });
    }
  };

  // Header for the main FlatList (hero + search + featured + "popular" header)
  const ListHeader = (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7b61ff" />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity><Icon name="menu" size={28} color="#fff" /></TouchableOpacity>
          <TouchableOpacity><Icon name="bell-outline" size={28} color="#fff" /></TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Search Any{'\n'}Topic</Text>

        <View style={styles.searchBar}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            placeholder="Search anything..."
            style={styles.searchInput}
            placeholderTextColor="#e0e7ff"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => runSearch(searchQuery)}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => runSearch(searchQuery)}>
            <Icon name="magnify" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {!showSearchResults && featuredCourse && (
        <TouchableOpacity onPress={() => onItemPress(featuredCourse)}>
          <ImageBackground
            source={{ uri: featuredCourse.imageUrl || 'https://blogger.googleusercontent.com/img/a/AVvXsEhoUgeOOOFDhUPdXnaIqgBHixqU9mhuWfO-PmMU7Ez4I356VndPIOnU3U6jxsbr6L9tdJ-06g7Jt6e7cphzVqx_uCPkcS9cvG1lqI76IlxHLyUJxEjqa-wYXeR3OHUB6x4hk10JMIhH400wbIgoTPhx3ipvJEyz868up_ux-KRW3D9CXPvMJacEMqB0' }}
            style={styles.featuredCard}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.featuredTextContainer}>
              <Text style={styles.featuredTitle}>{featuredCourse.name}</Text>
              <Text style={styles.featuredSubtitle}></Text>
            </View>
            <View style={styles.playButton}><Icon name="play" size={24} color="#7b61ff" /></View>
          </ImageBackground>
        </TouchableOpacity>
      )}

      {!showSearchResults && (
        <View style={[styles.popularSection, { paddingHorizontal: 20 }]}>
          <Text style={styles.sectionTitle}>Popular Courses</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <View style={[styles.wrap, styles.center]}>
        <ActivityIndicator size="large" color="#7b61ff" />
      </View>
    );
  }
  // --- Header composed UI (same visuals as before) ---
  const HeaderBrowse = (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7b61ff" />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity><Icon name="menu" size={28} color="#fff" /></TouchableOpacity>
          <TouchableOpacity><Icon name="bell-outline" size={28} color="#fff" /></TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Search Any{'\n'}Topic</Text>

        <View style={styles.searchBar}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            placeholder="Search anything..."
            style={styles.searchInput}
            placeholderTextColor="#e0e7ff"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => runSearch(searchQuery)}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => runSearch(searchQuery)}>
            <Icon name="magnify" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {featuredCourse && (
        <TouchableOpacity onPress={() => onItemPress(featuredCourse)}>
          <ImageBackground
            source={{ uri: featuredCourse.imageUrl || 'https://blogger.googleusercontent.com/img/a/AVvXsEhoUgeOOOFDhUPdXnaIqgBHixqU9mhuWfO-PmMU7Ez4I356VndPIOnU3U6jxsbr6L9tdJ-06g7Jt6e7cphzVqx_uCPkcS9cvG1lqI76IlxHLyUJxEjqa-wYXeR3OHUB6x4hk10JMIhH400wbIgoTPhx3ipvJEyz868up_ux-KRW3D9CXPvMJacEMqB0' }}
            style={styles.featuredCard}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.featuredTextContainer}>
              <Text style={styles.featuredTitle}>{featuredCourse.name}</Text>
              <Text style={styles.featuredSubtitle}></Text>
            </View>
            <View style={styles.playButton}><Icon name="play" size={24} color="#7b61ff" /></View>
          </ImageBackground>
        </TouchableOpacity>
      )}

      {/* Popular header + horizontal list to match original UI */}
      <View style={styles.popularSection}>
        <Text style={styles.sectionTitle}>Popular Courses</Text>
        <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
      </View>

      <FlatList
        data={popularCourses}
        keyExtractor={(it) => it.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <PopularCourseCard item={item} onPress={() => onItemPress(item)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
      />
    </>
  );

  // --- Header used in search mode (same search bar/hero style, no popular row) ---
  const HeaderSearch = (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7b61ff" />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity><Icon name="menu" size={28} color="#fff" /></TouchableOpacity>
          <TouchableOpacity><Icon name="bell-outline" size={28} color="#fff" /></TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Search Any{'\n'}Topic</Text>

        <View style={styles.searchBar}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            placeholder="Search anything..."
            style={styles.searchInput}
            placeholderTextColor="#e0e7ff"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => runSearch(searchQuery)}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => runSearch(searchQuery)}>
            <Icon name="magnify" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search hint / spinner area */}
      {isSearching ? <ActivityIndicator style={{ marginTop: 16 }} color="#7b61ff" /> : null}
    </>
  );
  // Data for the main FlatList: results grid OR popular (vertical list of horizontal cards)
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        key="home"
        data={[]}
        keyExtractor={() => 'x'}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <StatusBar barStyle="light-content" backgroundColor="#7b61ff" />
            <View style={styles.header}>
              <View style={styles.headerTopRow}>
                <TouchableOpacity><Icon name="menu" size={28} color="#fff" /></TouchableOpacity>
                <TouchableOpacity><Icon name="bell-outline" size={28} color="#fff" /></TouchableOpacity>
              </View>
              <Text style={styles.headerTitle}>Search Any{'\n'}Topic</Text>

              <View style={styles.searchBar}>
                <Icon name="magnify" size={22} color="#9ca3af" />
                <TextInput
                  placeholder="Search anything..."
                  style={styles.searchInput}
                  placeholderTextColor="#e0e7ff"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => runSearch(searchQuery)}
                  returnKeyType="search"
                />
                <TouchableOpacity style={styles.filterButton} onPress={() => runSearch(searchQuery)}>
                  <Icon name="magnify" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ====== Either results OR featured+popular, but SAME header container ====== */}
            {showSearchResults ? (
              <>
                {isSearching ? (
                  <ActivityIndicator style={{ marginTop: 16 }} color="#7b61ff" />
                ) : searchResults.length === 0 ? (
                  <Text style={styles.noResultsText}>No results found for “{searchQuery}”.</Text>
                ) : (
                  // Manual 2-column grid WITHOUT another FlatList
                  <View style={styles.resultsGrid}>
                    {searchResults.map(item => (
                      <View key={item.id} style={styles.resultsCell}>
                        {/* <SearchResultCard item={item} onPress={() => onItemPress(item)} /> */}
                        <SearchResultCard
                          item={item}
                          subtitle={item.parentId ? parentNameById.get(item.parentId) : 'Root'}
                          onPress={() => onItemPress(item)}
                        />

                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                {featuredCourse && (
                  <TouchableOpacity onPress={() => onItemPress(featuredCourse)}>
                    <ImageBackground
                      source={{ uri: featuredCourse.imageUrl || 'https://blogger.googleusercontent.com/img/a/AVvXsEhoUgeOOOFDhUPdXnaIqgBHixqU9mhuWfO-PmMU7Ez4I356VndPIOnU3U6jxsbr6L9tdJ-06g7Jt6e7cphzVqx_uCPkcS9cvG1lqI76IlxHLyUJxEjqa-wYXeR3OHUB6x4hk10JMIhH400wbIgoTPhx3ipvJEyz868up_ux-KRW3D9CXPvMJacEMqB0' }}
                      style={styles.featuredCard}
                      imageStyle={{ borderRadius: 20 }}
                    >
                      <View style={styles.featuredTextContainer}>
                        <Text style={styles.featuredTitle}>{featuredCourse.name}</Text>
                        <Text style={styles.featuredSubtitle}></Text>
                      </View>
                      <View style={styles.playButton}><Icon name="play" size={24} color="#7b61ff" /></View>
                    </ImageBackground>
                  </TouchableOpacity>
                )}

                <View style={[styles.popularSection, { paddingHorizontal: 20 }]}>
                  <Text style={styles.sectionTitle}>Popular Courses</Text>
                  <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
                </View>

                {/* horizontal list is OK (not vertical), so no nesting issue */}
                <FlatList
                  data={popularCourses}
                  keyExtractor={(it) => it.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <PopularCourseCard item={item} onPress={() => onItemPress(item)} />
                  )}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
                />
              </>
            )}
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Icon name="home" size={24} color="#166534" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Icon name="book-open-variant" size={24} color="#6b7280" /></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Icon name="message-reply-text-outline" size={24} color="#6b7280" /></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Icon name="clock-outline" size={24} color="#6b7280" /></TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <Icon name="contact" size={24} color="#166534" />
          <Text style={styles.navTextActive}>Contact Us</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#7b61ff', padding: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12, marginLeft: 8 },
  filterButton: { backgroundColor: '#9481ff', borderRadius: 8, padding: 8 },
  featuredCard: { height: 200, margin: 20, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'flex-end', padding: 16 },
  featuredTextContainer: { flex: 1 },
  featuredTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  featuredSubtitle: { fontSize: 14, color: '#e0e7ff' },
  playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  popularSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  seeAll: { fontSize: 14, color: '#7b61ff', fontWeight: '600' },
  popularCard: { width: 160, height: 200, marginRight: 16 },
  popularCardImage: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  popularCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16 },
  popularCardTitle: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', height: 80, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  navItem: { alignItems: 'center' },
  navItemActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  navTextActive: { marginLeft: 8, color: '#166534', fontWeight: 'bold' },
  searchCard: {
    flex: 1, margin: 6, padding: 16, backgroundColor: '#f3e8ff',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 120,
  },
  searchCardTitle: { marginTop: 8, textAlign: 'center', fontWeight: '600', color: '#3b0764' },
  noResultsText: { textAlign: 'center', marginTop: 20, color: '#6b7280', fontSize: 16 },
  resultsGrid: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultsCell: {
    width: '48%', // two columns
    marginBottom: 12,
  },
  resultsGrid: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultsCell: {
    width: '48%', // two columns
    marginBottom: 12,
  },

});










