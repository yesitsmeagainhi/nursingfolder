import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, TextInput, ImageBackground, FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

// Card for the "Popular Courses" horizontal list
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

// Card component for search results
const SearchResultCard = ({ item, onPress }) => {
  const iconName = item.type === 'folder' ? 'folder-outline' : 'file-document-outline';
  return (
    <TouchableOpacity style={styles.searchCard} onPress={onPress}>
      <Icon name={iconName} size={32} color="#581c87" />
      <Text style={styles.searchCardTitle} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [featuredCourse, setFeaturedCourse] = useState(null);
  const [popularCourses, setPopularCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Effect for initial data load
  useEffect(() => {
    const q = firestore()
      .collection('nodes')
      .where('parentId', '==', null)
      .where('type', '==', 'folder')
      .orderBy('order', 'asc');

    const unsub = q.onSnapshot(
      snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const featured = items.find(item => item.order === 1) || items[0] || null;
        const popular = items.filter(item => item.id !== featured?.id);
        setFeaturedCourse(featured);
        setPopularCourses(popular);
        setLoading(false);
      },
      e => {
        setErr(e?.message || 'Failed to load content');
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, []);

  // Function to perform the search
  const performSearch = async (query) => {
    if (query.trim().length <= 2) {
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const lowerQuery = query.toLowerCase();
      const querySnapshot = await firestore()
        .collection('nodes')
        .where('name_lowercase', '>=', lowerQuery)
        .where('name_lowercase', '<=', lowerQuery + '\uf8ff')
        .limit(10)
        .get();
        
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Generic navigation function
  const onItemPress = (item) => {
    if (item.type === 'folder') {
      navigation.navigate('Explorer', {
        openFolderId: item.id,
        openFolderName: item.name,
      });
    } else {
      navigation.navigate('Viewer', {
        title: item.name,
        type: item.type,
        url: item.url,
        embedUrl: item.embedUrl,
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.wrap, styles.center]}>
        <ActivityIndicator size="large" color="#7b61ff" />
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.wrap} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <StatusBar barStyle="light-content" backgroundColor="#7b61ff" />

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity><Icon name="menu" size={28} color="#fff" /></TouchableOpacity>
            <TouchableOpacity><Icon name="bell-outline" size={28} color="#fff" /></TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Search Any{"\n"}Topic</Text>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={22} color="#9ca3af" />
            <TextInput
              placeholder="Search anything..."
              style={styles.searchInput}
              placeholderTextColor="#e0e7ff"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.trim() === '') {
                  setShowSearchResults(false);
                }
              }}
              onSubmitEditing={() => performSearch(searchQuery)}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.filterButton} onPress={() => performSearch(searchQuery)}>
              <Icon name="magnify" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Conditional Rendering Logic */}
        {showSearchResults ? (
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <ActivityIndicator style={{marginTop: 20}} color="#7b61ff" />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={({ item }) => (
                  <SearchResultCard item={item} onPress={() => onItemPress(item)} />
                )}
                keyExtractor={item => item.id}
                numColumns={2}
              />
            ) : (
              <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
            )}
          </View>
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
                  <View style={styles.playButton}>
                    <Icon name="play" size={24} color="#7b61ff" />
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
            <View style={styles.popularSection}>
              <Text style={styles.sectionTitle}>Popular Courses</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>
            <FlatList
              data={popularCourses}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <PopularCourseCard item={item} onPress={() => onItemPress(item)} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            />
          </>
        )}
      </ScrollView>

      {/* Bottom Nav (Static Placeholder) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Icon name="home" size={24} color="#166534" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Icon name="book-open-variant" size={24} color="#6b7280" /></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Icon name="message-reply-text-outline" size={24} color="#6b7280" /></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Icon name="clock-outline" size={24} color="#6b7280" /></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Icon name="account-outline" size={24} color="#6b7280" /></TouchableOpacity>
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
  popularSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
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
  searchResultsContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    minHeight: 300,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6b7280',
    fontSize: 16,
  },
  searchCard: {
    flex: 1,
    margin: 6,
    padding: 16,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  searchCardTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    color: '#3b0764',
  },
});