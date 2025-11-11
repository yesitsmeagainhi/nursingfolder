// // src/screens/HomeScreen.js
// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, TouchableOpacity, StatusBar,
//   ActivityIndicator, TextInput, ImageBackground, FlatList,
//   Platform, PermissionsAndroid, ScrollView, useWindowDimensions,
// } from 'react-native';
// import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import firestore from '@react-native-firebase/firestore';
// import Fuse from 'fuse.js';
// import { NodeBrowserDrawer } from '../components/NodeBrowserDrawer';
// import { startLocalVideoWatcher } from '../utils/localVideoWatcher';
// import SafeHeader from '../components/SafeHeader';
// // import { SafeAreaView } from 'react-native-safe-area-context';

// // --- De-dupe helpers ---
// const n = (s) => (s || '').toString().trim().toLowerCase();

// const pickBest = (a, b) => {
//   const rank = (x) => (x?.type === 'folder' ? 0 : 1);
//   const ra = rank(a), rb = rank(b);
//   if (ra !== rb) return ra < rb ? a : b;
//   const oa = (typeof a?.order === 'number') ? a.order : Number.POSITIVE_INFINITY;
//   const ob = (typeof b?.order === 'number') ? b.order : Number.POSITIVE_INFINITY;
//   if (oa !== ob) return oa < ob ? a : b;
//   return a;
// };

// const normalizeUrl = (node) => {
//   const u = node?.url || node?.embedUrl || node?.meta?.videoUrl || node?.meta?.pdfUrl || node?.meta?.embedUrl || '';
//   try {
//     const url = new URL(u);
//     url.hash = '';
//     return `${url.protocol}//${url.host}${url.pathname}${url.search}`.replace(/\/$/, '').toLowerCase();
//   } catch {
//     return n(u).replace(/\/$/, '');
//   }
// };

// const contentKeyFor = (node) => {
//   const type = n(node?.type);
//   if (type === 'folder') return `folder:${n(node?.name)}:${node?.parentId || 'root'}`;
//   const urlKey = normalizeUrl(node);
//   if (urlKey) return `url:${urlKey}`;
//   return `${type}:${n(node?.name)}:${node?.parentId || ''}`;
// };

// const mergeAndDedupeByContent = (...lists) => {
//   const byKey = new Map();
//   for (const list of lists || []) {
//     for (const item of list || []) {
//       const key = contentKeyFor(item);
//       if (!byKey.has(key)) byKey.set(key, item);
//       else byKey.set(key, pickBest(byKey.get(key), item));
//     }
//   }
//   return Array.from(byKey.values());
// };

// // --- UI bits ---
// const PopularCourseCard = ({ item, onPress, scale }) => (
//   <TouchableOpacity onPress={onPress} style={[styles.popularCard, { width: 160 * scale, height: 200 * scale, marginRight: 16 * scale }]}>
//     {/* Ensure the bgImageUrl is correctly used */}
//     <ImageBackground
//       source={{ uri: item.bgImageUrl || 'https://default-image-url.com' }}  // Fallback image if bgImageUrl is missing
//       style={[styles.popularCardImage, { padding: 12 * scale }]}
//       imageStyle={{ borderRadius: 16 * scale }}
//     >
//       {/* Show ActivityIndicator if image is still loading */}
//       {!item.bgImageUrl && <ActivityIndicator size="small" color="#fff" />}

//       <View style={styles.popularCardOverlay} />
//       <Text style={[styles.popularCardTitle, { fontSize: 16 * scale }]} numberOfLines={2}>
//         {item.name}
//       </Text>
//     </ImageBackground>
//   </TouchableOpacity>
// );



// const SearchResultCard = ({ item, subtitle, onPress, scale }) => {
//   const iconName =
//     item.type === 'folder' ? 'folder-outline' :
//       item.type === 'video' ? 'play-circle-outline' :
//         item.type === 'pdf' ? 'file-pdf-box' :
//           'file-document-outline';

//   return (
//     <TouchableOpacity style={[styles.searchCard, { minHeight: 120 * scale, padding: 16 * scale, borderRadius: 12 * scale }]} onPress={onPress}>
//       <Icon name={iconName} size={32 * scale} color="#581c87" />
//       <Text style={[styles.searchCardTitle, { marginTop: 8 * scale, fontSize: 14 * scale }]} numberOfLines={2}>
//         {item.name}
//       </Text>
//       {!!subtitle && (
//         <Text style={{ marginTop: 4 * scale, color: '#6b7280', fontSize: 12 * scale }} numberOfLines={1}>
//           {subtitle}
//         </Text>
//       )}
//     </TouchableOpacity>
//   );
// };

// // Base height for bottom bar before safe-area padding is added
// const BOTTOM_BAR_BASE = 56;

// export default function HomeScreen({ navigation }) {
//   const insets = useSafeAreaInsets();
//   const { width, height } = useWindowDimensions();
//   // gentle scale: clamp between 0.9 and 1.12 for comfortable sizing
//   const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

//   const [showNodeBrowser, setShowNodeBrowser] = useState(false);

//   // hero + lists
//   const [loading, setLoading] = useState(true);
//   const [featuredCourse, setFeaturedCourse] = useState(null);
//   const [popularCourses, setPopularCourses] = useState([]);

//   // search
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isSearching, setIsSearching] = useState(false);
//   const [showSearchResults, setShowSearchResults] = useState(false);
//   const [searchResults, setSearchResults] = useState([]);

//   // local cache for fuzzy/substring search
//   const [allNodes, setAllNodes] = useState([]);
//   const [fuse, setFuse] = useState(null);
//   const parentNameById = new Map(allNodes.map(n => [n.id, n.name]));

//   // 1) Load root folders
//   useEffect(() => {
//     const q = firestore()
//       .collection('nodes')
//       .where('parentId', '==', null)  // Only get the root folders
//       .where('type', '==', 'folder')
//       .orderBy('order', 'asc');

//     const unsub = q.onSnapshot(
//       snap => {
//         const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
//         const featured = items.find(i => i.order === 1) || items[0] || null;
//         const popular = items.filter(i => i?.id !== featured?.id);
//         setFeaturedCourse(featured);  // Make sure to include the bgImageUrl in the item
//         setPopularCourses(popular);   // Same for popular courses
//         setLoading(false);
//       },
//       err => {
//         console.log('load root folders error', err);
//         setLoading(false);
//       }
//     );

//     return () => unsub && unsub();
//   }, []);



//   // 2) Build a local index (Fuse)
//   useEffect(() => {
//     const unsub = firestore().collection('nodes').onSnapshot(
//       snap => {
//         const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
//         setAllNodes(arr);
//         setFuse(new Fuse(arr, {
//           keys: ['name'],
//           threshold: 0.3,
//           ignoreLocation: true,
//           minMatchCharLength: 2,
//         }));
//       },
//       err => console.log('index error', err)
//     );
//     return () => unsub && unsub();
//   }, []);

//   // 3) Start local video watcher
//   useEffect(() => {
//     let stop;
//     (async () => {
//       if (Platform.OS === 'android' && Platform.Version >= 33) {
//         await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
//       }
//       stop = await startLocalVideoWatcher();
//     })();
//     return () => { stop?.(); };
//   }, []);

//   const prefixQueryOn = async (field, term, limit = 60) => {
//     try {
//       const s = await firestore()
//         .collection('nodes')
//         .where(field, '>=', term)
//         .where(field, '<', term + '\uf8ff')
//         .orderBy(field, 'asc')
//         .limit(limit)
//         .get();

//       const seen = new Set();
//       const rows = [];
//       for (const d of s.docs) {
//         if (!seen.has(d.id)) {
//           seen.add(d.id);
//           rows.push({ id: d.id, ...d.data() });
//         }
//       }
//       return rows;
//     } catch {
//       return [];
//     }
//   };

//   const runSearch = async (raw) => {
//     const term = (raw || '').trim().toLowerCase();
//     if (term.length < 2) {
//       setSearchResults([]);
//       setShowSearchResults(false);
//       return;
//     }

//     setIsSearching(true);
//     setShowSearchResults(true);

//     try {
//       const [a, b] = await Promise.allSettled([
//         prefixQueryOn('name_lc', term, 80),
//         prefixQueryOn('name_lowercase', term, 80),
//       ]);

//       const fromPrefix = [];
//       if (a.status === 'fulfilled') fromPrefix.push(...a.value);
//       if (b.status === 'fulfilled') fromPrefix.push(...b.value);

//       const fromFuse = fuse ? fuse.search(term).slice(0, 120).map(h => h.item) : [];
//       const fromIncludes = allNodes.filter(
//         n => typeof n.name === 'string' && n.name.toLowerCase().includes(term)
//       );

//       const merged = mergeAndDedupeByContent(fromPrefix, fromFuse, fromIncludes);

//       merged.sort((x, y) => {
//         const xf = x.type === 'folder' ? 0 : 1;
//         const yf = y.type === 'folder' ? 0 : 1;
//         if (xf !== yf) return xf - yf;
//         return String(x.name || '').localeCompare(String(y.name || ''));
//       });

//       setSearchResults(merged.slice(0, 120));
//     } catch {
//       setSearchResults([]);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   useEffect(() => {
//     const t = setTimeout(() => {
//       if (searchQuery.trim().length >= 2) runSearch(searchQuery);
//       else { setShowSearchResults(false); setSearchResults([]); }
//     }, 250);
//     return () => clearTimeout(t);
//   }, [searchQuery, fuse, allNodes]);

//   const onItemPress = (item) => {
//     if (item.type === 'folder') {
//       navigation.push('Explorer', { openFolderId: item.id, openFolderName: item.name });
//     } else {
//       navigation.push('Viewer', {
//         nodeId: item.id,
//         title: item.name,
//         type: item.type,
//         url: item.url || item.meta?.videoUrl || item.meta?.pdfUrl || null,
//         embedUrl: item.embedUrl || item.meta?.embedUrl || null,
//       });
//     }
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.wrap} edges={['bottom']}>
//         <ActivityIndicator style={[styles.center, { flex: 1 }]} size="large" color="#195ed2" />
//       </SafeAreaView>
//     );
//   }

//   const bottomPad = Math.max(insets.bottom, 10);
//   const bottomBarMinH = BOTTOM_BAR_BASE + bottomPad;

//   return (
//     <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
//       <StatusBar barStyle="light-content" backgroundColor="#195ed2" translucent={false} />
//       <ScrollView
//         contentInsetAdjustmentBehavior="automatic"
//         keyboardShouldPersistTaps="handled"
//         contentContainerStyle={{
//           paddingBottom: bottomBarMinH + 12,
//           minHeight: height - bottomBarMinH,
//         }}
//         showsVerticalScrollIndicator={false}
//       >

//         <SafeHeader
//           scale={scale}
//           bg="#195ed2"
//           leftIcon="menu"
//           rightIcon="bell-outline"
//           onPressLeft={() => setShowNodeBrowser(true)}
//           onPressRight={() => navigation.navigate('Notifications')}
//         >
//           <Text style={[styles.headerTitle, { fontSize: 32 * scale, marginTop: 20 * scale, marginBottom: 20 * scale }]}>
//             Search Any{'\n'}Topic
//           </Text>

//           <View style={[styles.searchBar, { borderRadius: 12 * scale, paddingHorizontal: 12 * scale }]}>
//             <Icon name="magnify" size={22 * scale} color="#e0e7ff" />
//             <TextInput
//               placeholder="Search anything..."
//               style={[styles.searchInput, { fontSize: 16 * scale, paddingVertical: 12 * scale, marginLeft: 8 * scale }]}
//               placeholderTextColor="#e0e7ff"
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//               onSubmitEditing={() => runSearch(searchQuery)}
//               returnKeyType="search"
//             />
//           </View>
//         </SafeHeader>


//         {showSearchResults ? (
//           <>
//             {isSearching ? (
//               <ActivityIndicator style={{ marginTop: 16 * scale }} color="#195ed2" />
//             ) : searchResults.length === 0 ? (
//               <Text style={[styles.noResultsText, { fontSize: 16 * scale }]}>
//                 No results found for “{searchQuery}”.
//               </Text>
//             ) : (
//               <View style={[styles.resultsGrid, { paddingHorizontal: 10 * scale }]}>
//                 {searchResults.map(item => (
//                   <View key={item.id} style={[styles.resultsCell, { width: '48%', marginBottom: 12 * scale }]}>
//                     <SearchResultCard
//                       item={item}
//                       subtitle={item.parentId ? parentNameById.get(item.parentId) : 'Root'}
//                       onPress={() => onItemPress(item)}
//                       scale={scale}
//                     />
//                   </View>
//                 ))}
//               </View>
//             )}
//           </>
//         )
//           : (
//             <>
//               {featuredCourse && (
//                 <TouchableOpacity onPress={() => onItemPress(featuredCourse)} activeOpacity={0.9}>
//                   <ImageBackground
//                     source={{ uri: featuredCourse?.bgImageUrl || 'https://default-image-url.com' }}
//                     style={[styles.featuredCard, { height: 200 * scale, margin: 20 * scale, padding: 16 * scale, borderRadius: 20 * scale }]}
//                     imageStyle={{ borderRadius: 20 * scale }}
//                   >
//                     <View style={styles.featuredTextContainer}>
//                       <Text style={[styles.featuredTitle, { fontSize: 20 * scale }]} numberOfLines={2}>
//                         {featuredCourse?.name}
//                       </Text>
//                       <Text style={[styles.featuredSubtitle, { fontSize: 14 * scale }]} numberOfLines={1}></Text>
//                     </View>
//                   </ImageBackground>

//                 </TouchableOpacity>
//               )}

//               <FlatList
//                 data={popularCourses}
//                 keyExtractor={(it) => it.id}
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 renderItem={({ item }) => (
//                   <PopularCourseCard item={item} onPress={() => onItemPress(item)} scale={scale} />
//                 )}
//                 contentContainerStyle={{ paddingHorizontal: 20 * scale, paddingBottom: 12 * scale }}
//               />
//             </>
//           )}
//       </ScrollView>


//       <NodeBrowserDrawer
//         visible={showNodeBrowser}
//         onClose={() => setShowNodeBrowser(false)}
//         userName="User"
//         onNavigate={(route) => navigation.navigate(route)}
//         onOpenFolder={(folder) => {
//           setShowNodeBrowser(false);
//           requestAnimationFrame(() => {
//             navigation.navigate('Explorer', {
//               openFolderId: folder.id,
//               openFolderName: folder.name,
//             });
//           });
//         }}
//         onOpenFile={(node) => {
//           if (node.type === 'folder') return;
//           if (node.type === 'video') {
//             navigation.push('Viewer', {
//               nodeId: node.id, title: node.name, type: 'video',
//               url: node.url, embedUrl: node.embedUrl
//             });
//           } else if ((node.url || '').toLowerCase().endsWith('.pdf') || node.type === 'pdf') {
//             navigation.push('Viewer', { nodeId: node.id, title: node.name, type: 'pdf', url: node.url });
//           } else {
//             navigation.push('Viewer', { nodeId: node.id, title: node.name, type: node.type, url: node.url });
//           }
//         }}
//       />


//       <View
//         style={[
//           styles.bottomNav,
//           {
//             paddingBottom: bottomPad,
//             paddingTop: 8,
//             minHeight: BOTTOM_BAR_BASE + bottomPad,
//           },
//         ]}
//       >
//         <TouchableOpacity style={styles.navItem} activeOpacity={0.9}>
//           <Icon name="home" size={22 * scale} color="#166534" />
//           <Text style={[styles.navTextActive, { fontSize: 12 * scale }]}>Home</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('AI')}>
//           <Icon name="robot" size={28 * scale} color="#195ed2" />
//           <Text style={[styles.navTextSoon, { fontSize: 12 * scale }]}>AI coming soon</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('Contact')}>
//           <Icon name="contacts" size={22 * scale} color="#166534" />
//           <Text style={[styles.navTextActive, { fontSize: 12 * scale }]}>Contact Us</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>

//   );
// }

// const styles = StyleSheet.create({
//   wrap: { flex: 1, backgroundColor: '#f8fafc' },
//   center: { alignItems: 'center', justifyContent: 'center' },

//   headerTitle: { fontWeight: 'bold', color: '#fff' },

//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   searchInput: { flex: 1, color: '#fff' },
//   filterButton: { backgroundColor: '#9481ff' },

//   featuredCard: {
//     justifyContent: 'space-between',
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//   },
//   featuredTextContainer: { flex: 1 },
//   featuredTitle: { color: '#fff', fontWeight: 'bold' },
//   featuredSubtitle: { color: '#e0e7ff' },
//   playButton: {
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   popularCard: {},
//   popularCardImage: { flex: 1, justifyContent: 'flex-end' },
//   popularCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16 },
//   popularCardTitle: { color: '#fff', fontWeight: 'bold' },

//   resultsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   resultsCell: {},
//   searchCard: {
//     backgroundColor: '#f3e8ff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   searchCardTitle: { textAlign: 'center', fontWeight: '600', color: '#3b0764' },
//   noResultsText: { textAlign: 'center', color: '#6b7280' },

//   bottomNav: {
//     position: 'absolute',
//     left: 0, right: 0, bottom: 0,
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#e5e7eb',
//   },
//   navItem: { alignItems: 'center' },
//   navTextActive: { color: '#166534', fontWeight: '600', marginTop: 4 },
//   navTextSoon: { color: '#195ed2', marginTop: 4 },
// });





// // src/screens/HomeScreen.js
// // import React, { useEffect, useState } from 'react';
// // import {
// //   View, Text, StyleSheet, TouchableOpacity, StatusBar,
// //   ActivityIndicator, TextInput, ImageBackground, FlatList,
// //   Platform, PermissionsAndroid,
// // } from 'react-native';
// // import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// // import firestore from '@react-native-firebase/firestore';
// // import Fuse from 'fuse.js';
// // import { NodeBrowserSheet } from '../components/NodeBrowserSheet';
// // import { NodeBrowserDrawer } from '../components/NodeBrowserDrawer';
// // import { startLocalVideoWatcher } from '../utils/localVideoWatcher'; // <-- Option 1 watcher










// // // import notifee, { AndroidImportance } from '@notifee/react-native';
// // // import AsyncStorage from '@react-native-async-storage/async-storage';
// // // AsyncStorage.multiRemove(['lastVideoNotifiedAt', 'notifiedVideoIds']);

// // // // Example test trigger
// // // async function showTestNotification() {
// // //   // create a channel (needed for Android)
// // //   const channelId = await notifee.createChannel({
// // //     id: 'default',
// // //     name: 'Default Channel',
// // //     importance: AndroidImportance.HIGH,
// // //   });

// // //   await notifee.displayNotification({
// // //     title: '🔥 Test Notification',
// // //     body: 'This is a test from your app!',
// // //     android: { channelId },
// // //   });
// // // }











// // const PopularCourseCard = ({ item, onPress }) => (
// //   <TouchableOpacity onPress={onPress} style={styles.popularCard}>
// //     <ImageBackground
// //       source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070' }}
// //       style={styles.popularCardImage}
// //       imageStyle={{ borderRadius: 16 }}
// //     >
// //       <View style={styles.popularCardOverlay} />
// //       <Text style={styles.popularCardTitle}>{item.name}</Text>
// //     </ImageBackground>
// //   </TouchableOpacity>
// // );

// // const SearchResultCard = ({ item, subtitle, onPress }) => {
// //   const iconName =
// //     item.type === 'folder' ? 'folder-outline' :
// //       item.type === 'video' ? 'play-circle-outline' :
// //         item.type === 'pdf' ? 'file-pdf-box' :
// //           'file-document-outline';
// //   return (

// //     <TouchableOpacity style={styles.searchCard} onPress={onPress}>
// //       <Icon name={iconName} size={32} color="#581c87" />
// //       <Text style={styles.searchCardTitle} numberOfLines={2}>{item.name}</Text>
// //       {subtitle ? (
// //         <Text style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }} numberOfLines={1}>
// //           {subtitle}
// //         </Text>
// //       ) : null}
// //     </TouchableOpacity>
// //   );
// // };

// // export default function HomeScreen({ navigation }) {
// //   const [showNodeBrowser, setShowNodeBrowser] = useState(false);

// //   // hero + lists
// //   const [loading, setLoading] = useState(true);
// //   const [featuredCourse, setFeaturedCourse] = useState(null);
// //   const [popularCourses, setPopularCourses] = useState([]);

// //   // search
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [isSearching, setIsSearching] = useState(false);
// //   const [showSearchResults, setShowSearchResults] = useState(false);
// //   const [searchResults, setSearchResults] = useState([]);

// //   // local cache for fuzzy/substring search
// //   const [allNodes, setAllNodes] = useState([]);
// //   const [fuse, setFuse] = useState(null);
// //   const parentNameById = new Map(allNodes.map(n => [n.id, n.name]));

// //   // === 1) Load root folders (featured + popular) and flip loading -> false
// //   useEffect(() => {
// //     const q = firestore()
// //       .collection('nodes')
// //       .where('parentId', '==', null)
// //       .where('type', '==', 'folder')
// //       .orderBy('order', 'asc');

// //     const unsub = q.onSnapshot(
// //       snap => {
// //         const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
// //         const featured = items.find(i => i.order === 1) || items[0] || null;
// //         const popular = items.filter(i => i?.id !== featured?.id);
// //         setFeaturedCourse(featured);
// //         setPopularCourses(popular);
// //         setLoading(false);
// //       },
// //       err => {
// //         console.log('load root folders error', err);
// //         setLoading(false);
// //       }
// //     );

// //     return () => unsub && unsub();
// //   }, []);

// //   // === 2) Build a local index (Fuse) so we can substring/typo search
// //   useEffect(() => {
// //     const unsub = firestore().collection('nodes').onSnapshot(
// //       snap => {
// //         const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
// //         setAllNodes(arr);
// //         setFuse(new Fuse(arr, {
// //           keys: ['name'],
// //           threshold: 0.3,
// //           ignoreLocation: true,
// //           minMatchCharLength: 2,
// //         }));
// //       },
// //       err => console.log('index error', err)
// //     );
// //     return () => unsub && unsub();
// //   }, []);

// //   // === 3) Start the local video watcher (Option 1) for in-app notifications
// //   useEffect(() => {
// //     let stop;
// //     (async () => {
// //       // Android 13+ permission (safe to call; watcher also asks if needed)
// //       if (Platform.OS === 'android' && Platform.Version >= 33) {
// //         await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
// //       }
// //       stop = await startLocalVideoWatcher();
// //     })();
// //     return () => { stop?.(); };
// //   }, []);

// //   // Helper: Firestore prefix query if you happen to have name_lc/name_lowercase
// //   const prefixQueryOn = async (field, term, limit = 40) => {
// //     try {
// //       const s = await firestore()
// //         .collection('nodes')
// //         .where(field, '>=', term)
// //         .where(field, '<', term + '\uf8ff')
// //         .orderBy(field, 'asc')
// //         .limit(limit)
// //         .get();
// //       return s.docs.map(d => ({ id: d.id, ...d.data() }));
// //     } catch {
// //       return [];
// //     }
// //   };

// //   // Unified search: prefix (both fields) + Fuse + substring
// //   const runSearch = async (raw) => {
// //     const term = (raw || '').trim().toLowerCase();
// //     if (term.length < 2) {
// //       setSearchResults([]);
// //       setShowSearchResults(false);
// //       return;
// //     }

// //     setIsSearching(true);
// //     setShowSearchResults(true);

// //     try {
// //       const [a, b] = await Promise.allSettled([
// //         prefixQueryOn('name_lc', term, 60),
// //         prefixQueryOn('name_lowercase', term, 60),
// //       ]);
// //       const fromPrefix = [
// //         ...(a.status === 'fulfilled' ? a.value : []),
// //         ...(b.status === 'fulfilled' ? b.value : []),
// //       ];

// //       const fromFuse = fuse ? fuse.search(term).slice(0, 60).map(h => h.item) : [];

// //       const fromIncludes = allNodes.filter(
// //         n => typeof n.name === 'string' && n.name.toLowerCase().includes(term)
// //       );

// //       const map = new Map();
// //       [...fromPrefix, ...fromFuse, ...fromIncludes].forEach(x => map.set(x.id, x));
// //       const merged = Array.from(map.values()).sort((x, y) => {
// //         const xf = x.type === 'folder' ? 0 : 1;
// //         const yf = y.type === 'folder' ? 0 : 1;
// //         if (xf !== yf) return xf - yf;
// //         return String(x.name || '').localeCompare(String(y.name || ''));
// //       });

// //       setSearchResults(merged);
// //     } catch (e) {
// //       setSearchResults([]);
// //     } finally {
// //       setIsSearching(false);
// //     }
// //   };

// //   // Debounce typing → runSearch
// //   useEffect(() => {
// //     const t = setTimeout(() => {
// //       if (searchQuery.trim().length >= 2) {
// //         runSearch(searchQuery);
// //       } else {
// //         setShowSearchResults(false);
// //         setSearchResults([]);
// //       }
// //     }, 250);
// //     return () => clearTimeout(t);
// //   }, [searchQuery, fuse, allNodes]);

// //   // Navigation
// //   const onItemPress = (item) => {
// //     if (item.type === 'folder') {
// //       navigation.push('Explorer', { openFolderId: item.id, openFolderName: item.name });
// //     } else {
// //       navigation.push('Viewer', {
// //         nodeId: item.id,
// //         title: item.name,
// //         type: item.type,
// //         url: item.url || item.meta?.videoUrl || item.meta?.pdfUrl || null,
// //         embedUrl: item.embedUrl || item.meta?.embedUrl || null,
// //       });
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <View style={[styles.wrap, styles.center]}>
// //         <ActivityIndicator size="large" color="#195ed2" />
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
// //       <FlatList
// //         key="home"
// //         data={[]}
// //         keyExtractor={() => 'x'}
// //         keyboardShouldPersistTaps="handled"
// //         ListHeaderComponent={
// //           <>
// //             <StatusBar barStyle="light-content" backgroundColor="#195ed2" />
// //             <View style={styles.header}>
// //               <View style={styles.headerTopRow}>
// //                 {/* OPEN NODE BROWSER */}
// //                 <TouchableOpacity onPress={() => setShowNodeBrowser(true)}>
// //                   <Icon name="menu" size={28} color="#fff" />
// //                 </TouchableOpacity>
// //                 {/* <TouchableOpacity
// //                   onPress={showTestNotification}
// //                   style={{ backgroundColor: '#195ed2', padding: 10, borderRadius: 8, margin: 20 }}>
// //                   <Text style={{ color: '#fff', textAlign: 'center' }}>Send Test Notification</Text>
// //                 </TouchableOpacity> */}

// //                 <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
// //                   <Icon name="bell-outline" size={28} color="#fff" />
// //                 </TouchableOpacity>
// //               </View>

// //               <Text style={styles.headerTitle}>Search Any{'\n'}Topic</Text>

// //               <View style={styles.searchBar}>
// //                 <Icon name="magnify" size={22} color="#9ca3af" />
// //                 <TextInput
// //                   placeholder="Search anything..."
// //                   style={styles.searchInput}
// //                   placeholderTextColor="#e0e7ff"
// //                   value={searchQuery}
// //                   onChangeText={setSearchQuery}
// //                   onSubmitEditing={() => runSearch(searchQuery)}
// //                   returnKeyType="search"
// //                 />
// //                 <TouchableOpacity style={styles.filterButton} onPress={() => runSearch(searchQuery)}>
// //                   <Icon name="magnify" size={22} color="#fff" />
// //                 </TouchableOpacity>
// //               </View>
// //             </View>

// //             {/* Results or Featured + Popular */}
// //             {showSearchResults ? (
// //               <>
// //                 {isSearching ? (
// //                   <ActivityIndicator style={{ marginTop: 16 }} color="#195ed2" />
// //                 ) : searchResults.length === 0 ? (
// //                   <Text style={styles.noResultsText}>No results found for “{searchQuery}”.</Text>
// //                 ) : (
// //                   <View style={styles.resultsGrid}>
// //                     {searchResults.map(item => (
// //                       <View key={item.id} style={styles.resultsCell}>
// //                         <SearchResultCard
// //                           item={item}
// //                           subtitle={item.parentId ? parentNameById.get(item.parentId) : 'Root'}
// //                           onPress={() => onItemPress(item)}
// //                         />
// //                       </View>
// //                     ))}
// //                   </View>
// //                 )}
// //               </>
// //             ) : (
// //               <>
// //                 {featuredCourse && (
// //                   <TouchableOpacity onPress={() => onItemPress(featuredCourse)}>
// //                     <ImageBackground
// //                       source={{ uri: featuredCourse.imageUrl || 'https://blogger.googleusercontent.com/img/a/AVvXsEhoUgeOOOFDhUPdXnaIqgBHixqU9mhuWfO-PmMU7Ez4I356VndPIOnU3U6jxsbr6L9tdJ-06g7Jt6e7cphzVqx_uCPkcS9cvG1lqI76IlxHLyUJxEjqa-wYXeR3OHUB6x4hk10JMIhH400wbIgoTPhx3ipvJEyz868up_ux-KRW3D9CXPvMJacEMqB0' }}
// //                       style={styles.featuredCard}
// //                       imageStyle={{ borderRadius: 20 }}
// //                     >
// //                       <View style={styles.featuredTextContainer}>
// //                         <Text style={styles.featuredTitle}>{featuredCourse.name}</Text>
// //                         <Text style={styles.featuredSubtitle}></Text>
// //                       </View>
// //                       <View style={styles.playButton}><Icon name="play" size={24} color="#195ed2" /></View>
// //                     </ImageBackground>
// //                   </TouchableOpacity>
// //                 )}

// //                 {/* <View style={[styles.popularSection, { paddingHorizontal: 20 }]}>
// //                   <Text style={styles.sectionTitle}>Popular Courses</Text>
// //                   <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
// //                 </View> */}

// //                 <FlatList
// //                   data={popularCourses}
// //                   keyExtractor={(it) => it.id}
// //                   horizontal
// //                   showsHorizontalScrollIndicator={false}
// //                   renderItem={({ item }) => (
// //                     <PopularCourseCard item={item} onPress={() => onItemPress(item)} />
// //                   )}
// //                   contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
// //                 />
// //               </>
// //             )}
// //           </>
// //         }
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={{ paddingBottom: 100 }}
// //       />

// //       {/* Drawer */}
// //       <NodeBrowserDrawer
// //         visible={showNodeBrowser}
// //         onClose={() => setShowNodeBrowser(false)}
// //         userName="User"
// //         onNavigate={(route) => navigation.navigate(route)}   // 👈 must be here
// //         onOpenFolder={(folder) => {
// //           // close drawer first, then navigate
// //           setShowNodeBrowser(false);
// //           requestAnimationFrame(() => {
// //             navigation.navigate('Explorer', {
// //               openFolderId: folder.id,
// //               openFolderName: folder.name,
// //             });
// //           });
// //         }}
// //         onOpenFile={(node) => {
// //           if (node.type === 'folder') return;
// //           if (node.type === 'video') {
// //             navigation.push('Viewer', {
// //               nodeId: node.id, title: node.name, type: 'video',
// //               url: node.url, embedUrl: node.embedUrl
// //             });
// //           } else if ((node.url || '').toLowerCase().endsWith('.pdf') || node.type === 'pdf') {
// //             navigation.push('Viewer', { nodeId: node.id, title: node.name, type: 'pdf', url: node.url });
// //           } else {
// //             navigation.push('Viewer', { nodeId: node.id, title: node.name, type: node.type, url: node.url });
// //           }
// //         }}
// //       />

// //       {/* Bottom Nav */}
// //       <View style={{ height: 24 }} />
// //       <View style={styles.bottomNav}>
// //         <TouchableOpacity style={styles.navItemActive}>
// //           <Icon name="home" size={22} color="#166534" />
// //           <Text style={styles.navTextActive}>Home</Text>
// //         </TouchableOpacity>

// //         <TouchableOpacity style={styles.aiButton} activeOpacity={0.8}
// //           onPress={() => navigation.navigate('AI')}>
// //           <View /* style={styles.aiIconContainer} */>
// //             <Icon name="robot" size={32} color="#195ed2" />
// //           </View>
// //           <Text style={styles.navTextSoon}>AI coming soon</Text>
// //         </TouchableOpacity>

// //         <TouchableOpacity
// //           style={styles.navItemActive}
// //           onPress={() => navigation.navigate('Contact')}
// //         >
// //           <Icon name="contacts" size={22} color="#166534" />
// //           <Text style={styles.navTextActive}>Contact Us</Text>
// //         </TouchableOpacity>
// //       </View>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   wrap: { flex: 1, backgroundColor: '#f8fafc' },
// //   center: { alignItems: 'center', justifyContent: 'center' },

// //   header: {
// //     backgroundColor: '#195ed2',
// //     padding: 20,
// //     borderBottomLeftRadius: 30,
// //     borderBottomRightRadius: 30,
// //   },
// //   headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
// //   headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 20, marginBottom: 20 },

// //   searchBar: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: 'rgba(255, 255, 255, 0.2)',
// //     borderRadius: 12,
// //     paddingHorizontal: 12,
// //   },
// //   searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12, marginLeft: 8 },
// //   filterButton: { backgroundColor: '#9481ff', borderRadius: 8, padding: 8 },

// //   featuredCard: {
// //     height: 200,
// //     margin: 20,
// //     justifyContent: 'space-between',
// //     flexDirection: 'row',
// //     alignItems: 'flex-end',
// //     padding: 16,
// //   },
// //   featuredTextContainer: { flex: 1 },
// //   featuredTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
// //   featuredSubtitle: { fontSize: 14, color: '#e0e7ff' },
// //   playButton: {
// //     width: 44,
// //     height: 44,
// //     borderRadius: 22,
// //     backgroundColor: '#fff',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },

// //   popularSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
// //   sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
// //   seeAll: { fontSize: 14, color: '#195ed2', fontWeight: '600' },
// //   popularCard: { width: 160, height: 200, marginRight: 16 },
// //   popularCardImage: { flex: 1, justifyContent: 'flex-end', padding: 12 },
// //   popularCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16 },
// //   popularCardTitle: { fontSize: 16, color: '#fff', fontWeight: 'bold' },

// //   resultsGrid: {
// //     paddingHorizontal: 10,
// //     flexDirection: 'row',
// //     flexWrap: 'wrap',
// //     justifyContent: 'space-between',
// //   },
// //   resultsCell: { width: '48%', marginBottom: 12 },
// //   searchCard: {
// //     flex: 1,
// //     margin: 6,
// //     padding: 16,
// //     backgroundColor: '#f3e8ff',
// //     borderRadius: 12,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     minHeight: 120,
// //   },
// //   searchCardTitle: { marginTop: 8, textAlign: 'center', fontWeight: '600', color: '#3b0764' },
// //   noResultsText: { textAlign: 'center', marginTop: 20, color: '#6b7280', fontSize: 16 },

// //   bottomNav: {
// //     position: 'absolute',
// //     bottom: 0, left: 0, right: 0,
// //     flexDirection: 'row',
// //     justifyContent: 'space-around',
// //     alignItems: 'center',
// //     backgroundColor: '#fff',
// //     height: 80,
// //     borderTopWidth: 1,
// //     borderTopColor: '#e5e7eb',
// //     paddingVertical: 10,
// //   },
// //   navItem: { alignItems: 'center' },
// //   navItemActive: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: '#d1fae5',
// //     borderRadius: 20,
// //     paddingHorizontal: 16,
// //     paddingVertical: 8,
// //   },
// //   navTextActive: { marginLeft: 8, color: '#166534', fontWeight: 'bold' },

// //   aiButton: { alignItems: 'center', justifyContent: 'center' },
// //   navTextSoon: {
// //     fontSize: 12, color: '#195ed2', marginTop: 6, fontWeight: '600', textAlign: 'center',
// //   },
// // });







// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  ActivityIndicator, TextInput, ImageBackground, FlatList,
  Platform, PermissionsAndroid, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import Fuse from 'fuse.js';
import { NodeBrowserDrawer } from '../components/NodeBrowserDrawer';
import { startLocalVideoWatcher } from '../utils/localVideoWatcher';
import SafeHeader from '../components/SafeHeader';

// --- De-dupe helpers ---
const n = (s) => (s || '').toString().trim().toLowerCase();

const pickBest = (a, b) => {
  const rank = (x) => (x?.type === 'folder' ? 0 : 1);
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra < rb ? a : b;
  const oa = (typeof a?.order === 'number') ? a.order : Number.POSITIVE_INFINITY;
  const ob = (typeof b?.order === 'number') ? b.order : Number.POSITIVE_INFINITY;
  if (oa !== ob) return oa < ob ? a : b;
  return a;
};

// CHANGED: removed any use of embedUrl/meta.embedUrl here
const normalizeUrl = (node) => {
  const u = node?.url || node?.meta?.videoUrl || node?.meta?.pdfUrl || '';
  try {
    const url = new URL(u);
    url.hash = '';
    return `${url.protocol}//${url.host}${url.pathname}${url.search}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return n(u).replace(/\/$/, '');
  }
};

const contentKeyFor = (node) => {
  const type = n(node?.type);
  if (type === 'folder') return `folder:${n(node?.name)}:${node?.parentId || 'root'}`;
  const urlKey = normalizeUrl(node);
  if (urlKey) return `url:${urlKey}`;
  return `${type}:${n(node?.name)}:${node?.parentId || ''}`;
};

const mergeAndDedupeByContent = (...lists) => {
  const byKey = new Map();
  for (const list of lists || []) {
    for (const item of list || []) {
      const key = contentKeyFor(item);
      if (!byKey.has(key)) byKey.set(key, item);
      else byKey.set(key, pickBest(byKey.get(key), item));
    }
  }
  return Array.from(byKey.values());
};

// --- UI bits ---
const PopularCourseCard = ({ item, onPress, scale }) => (
  <TouchableOpacity onPress={onPress} style={[styles.popularCard, { width: 160 * scale, height: 200 * scale, marginRight: 16 * scale }]}>
    <ImageBackground
      source={{ uri: item.bgImageUrl || 'https://default-image-url.com' }}
      style={[styles.popularCardImage, { padding: 12 * scale }]}
      imageStyle={{ borderRadius: 16 * scale }}
    >
      {!item.bgImageUrl && <ActivityIndicator size="small" color="#fff" />}
      <View style={styles.popularCardOverlay} />
      <Text style={[styles.popularCardTitle, { fontSize: 16 * scale }]} numberOfLines={2}>
        {item.name}
      </Text>
    </ImageBackground>
  </TouchableOpacity>
);

const SearchResultCard = ({ item, subtitle, onPress, scale }) => {
  const iconName =
    item.type === 'folder' ? 'folder-outline' :
      item.type === 'video' ? 'play-circle-outline' :
        item.type === 'pdf' ? 'file-pdf-box' :
          'file-document-outline';

  return (
    <TouchableOpacity style={[styles.searchCard, { minHeight: 120 * scale, padding: 16 * scale, borderRadius: 12 * scale }]} onPress={onPress}>
      <Icon name={iconName} size={32 * scale} color="#581c87" />
      <Text style={[styles.searchCardTitle, { marginTop: 8 * scale, fontSize: 14 * scale }]} numberOfLines={2}>
        {item.name}
      </Text>
      {!!subtitle && (
        <Text style={{ marginTop: 4 * scale, color: '#6b7280', fontSize: 12 * scale }} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Base height for bottom bar before safe-area padding is added
const BOTTOM_BAR_BASE = 56;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scale = Math.min(Math.max(width / 390, 0.9), 1.12);

  const [showNodeBrowser, setShowNodeBrowser] = useState(false);

  // hero + lists
  const [loading, setLoading] = useState(true);
  const [featuredCourse, setFeaturedCourse] = useState(null);
  const [popularCourses, setPopularCourses] = useState([]);

  // search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // local cache for fuzzy/substring search
  const [allNodes, setAllNodes] = useState([]);
  const [fuse, setFuse] = useState(null);
  const parentNameById = new Map(allNodes.map(n => [n.id, n.name]));

  // 1) Load root folders
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
        const popular = items.filter(i => i?.id !== featured?.id);
        setFeaturedCourse(featured);
        setPopularCourses(popular);
        setLoading(false);
      },
      err => {
        console.log('load root folders error', err);
        setLoading(false);
      }
    );

    return () => unsub && unsub();
  }, []);

  // 2) Build a local index (Fuse)
  useEffect(() => {
    const unsub = firestore().collection('nodes').onSnapshot(
      snap => {
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllNodes(arr);
        setFuse(new Fuse(arr, {
          keys: ['name'],
          threshold: 0.3,
          ignoreLocation: true,
          minMatchCharLength: 2,
        }));
      },
      err => console.log('index error', err)
    );
    return () => unsub && unsub();
  }, []);

  // 3) Start local video watcher
  useEffect(() => {
    let stop;
    (async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      stop = await startLocalVideoWatcher();
    })();
    return () => { stop?.(); };
  }, []);

  const prefixQueryOn = async (field, term, limit = 60) => {
    try {
      const s = await firestore()
        .collection('nodes')
        .where(field, '>=', term)
        .where(field, '<', term + '\uf8ff')
        .orderBy(field, 'asc')
        .limit(limit)
        .get();

      const seen = new Set();
      const rows = [];
      for (const d of s.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          rows.push({ id: d.id, ...d.data() });
        }
      }
      return rows;
    } catch {
      return [];
    }
  };

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
        prefixQueryOn('name_lc', term, 80),
        prefixQueryOn('name_lowercase', term, 80),
      ]);

      const fromPrefix = [];
      if (a.status === 'fulfilled') fromPrefix.push(...a.value);
      if (b.status === 'fulfilled') fromPrefix.push(...b.value);

      const fromFuse = fuse ? fuse.search(term).slice(0, 120).map(h => h.item) : [];
      const fromIncludes = allNodes.filter(
        n => typeof n.name === 'string' && n.name.toLowerCase().includes(term)
      );

      const merged = mergeAndDedupeByContent(fromPrefix, fromFuse, fromIncludes);

      merged.sort((x, y) => {
        const xf = x.type === 'folder' ? 0 : 1;
        const yf = y.type === 'folder' ? 0 : 1;
        if (xf !== yf) return xf - yf;
        return String(x.name || '').localeCompare(String(y.name || ''));
      });

      setSearchResults(merged.slice(0, 120));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length >= 2) runSearch(searchQuery);
      else { setShowSearchResults(false); setSearchResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, fuse, allNodes]);

  // CHANGED: no embedUrl passed anywhere
  const onItemPress = (item) => {
    if (item.type === 'folder') {
      navigation.push('Explorer', { openFolderId: item.id, openFolderName: item.name });
      return;
    }

    const url =
      item.url ||
      item.meta?.videoUrl ||
      item.meta?.pdfUrl ||
      null;

    navigation.push('Viewer', {
      nodeId: item.id,
      title: item.name,
      type: item.type,
      url,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.wrap} edges={['bottom']}>
        <ActivityIndicator style={[styles.center, { flex: 1 }]} size="large" color="#195ed2" />
      </SafeAreaView>
    );
  }

  const bottomPad = Math.max(insets.bottom, 10);
  const bottomBarMinH = BOTTOM_BAR_BASE + bottomPad;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#195ed2" translucent={false} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: bottomBarMinH + 12,
          minHeight: height - bottomBarMinH,
        }}
        showsVerticalScrollIndicator={false}
      >

        <SafeHeader
          scale={scale}
          bg="#195ed2"
          leftIcon="menu"
          rightIcon="bell-outline"
          onPressLeft={() => setShowNodeBrowser(true)}
          onPressRight={() => navigation.navigate('Notifications')}
        >
          <Text style={[styles.headerTitle, { fontSize: 32 * scale, marginTop: 20 * scale, marginBottom: 20 * scale }]}>
            Search Any{'\n'}Topic
          </Text>

          <View style={[styles.searchBar, { borderRadius: 12 * scale, paddingHorizontal: 12 * scale }]}>
            <Icon name="magnify" size={22 * scale} color="#e0e7ff" />
            <TextInput
              placeholder="Search anything..."
              style={[styles.searchInput, { fontSize: 16 * scale, paddingVertical: 12 * scale, marginLeft: 8 * scale }]}
              placeholderTextColor="#e0e7ff"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => runSearch(searchQuery)}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                  setSearchResults([]);
                }}
                style={{
                  position: 'absolute',
                  right: 10 * scale,
                  height: '100%',
                  justifyContent: 'center',
                }}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Icon name="close-circle" size={20 * scale} color="#e0e7ff" />
              </TouchableOpacity>
            )}
          </View>
        </SafeHeader>

        {showSearchResults ? (
          <>
            {isSearching ? (
              <ActivityIndicator style={{ marginTop: 16 * scale }} color="#195ed2" />
            ) : searchResults.length === 0 ? (
              <Text style={[styles.noResultsText, { fontSize: 16 * scale }]}>
                No results found for “{searchQuery}”.
              </Text>
            ) : (
              <View style={[styles.resultsGrid, { paddingHorizontal: 10 * scale }]}>
                {searchResults.map(item => (
                  <View key={item.id} style={[styles.resultsCell, { width: '48%', marginBottom: 12 * scale }]}>
                    <SearchResultCard
                      item={item}
                      subtitle={item.parentId ? parentNameById.get(item.parentId) : 'Root'}
                      onPress={() => onItemPress(item)}
                      scale={scale}
                    />
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {featuredCourse && (
              <TouchableOpacity onPress={() => onItemPress(featuredCourse)} activeOpacity={0.9}>
                <ImageBackground
                  source={{ uri: featuredCourse?.bgImageUrl || 'https://default-image-url.com' }}
                  style={[styles.featuredCard, { height: 200 * scale, margin: 20 * scale, padding: 16 * scale, borderRadius: 20 * scale }]}
                  imageStyle={{ borderRadius: 20 * scale }}
                >
                  <View style={styles.featuredTextContainer}>
                    <Text style={[styles.featuredTitle, { fontSize: 20 * scale }]} numberOfLines={2}>
                      {featuredCourse?.name}
                    </Text>
                    <Text style={[styles.featuredSubtitle, { fontSize: 14 * scale }]} numberOfLines={1}></Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}

            <FlatList
              data={popularCourses}
              keyExtractor={(it) => it.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <PopularCourseCard item={item} onPress={() => onItemPress(item)} scale={scale} />
              )}
              contentContainerStyle={{ paddingHorizontal: 20 * scale, paddingBottom: 12 * scale }}
            />
          </>
        )}
      </ScrollView>

      <NodeBrowserDrawer
        visible={showNodeBrowser}
        onClose={() => setShowNodeBrowser(false)}
        userName="User"
        onNavigate={(route) => navigation.navigate(route)}
        onOpenFolder={(folder) => {
          setShowNodeBrowser(false);
          requestAnimationFrame(() => {
            navigation.navigate('Explorer', {
              openFolderId: folder.id,
              openFolderName: folder.name,
            });
          });
        }}
        onOpenFile={(node) => {
          if (node.type === 'folder') return;

          const url =
            node.url ||
            node.meta?.videoUrl ||
            node.meta?.pdfUrl ||
            null;

          if (node.type === 'video') {
            navigation.push('Viewer', {
              nodeId: node.id,
              title: node.name,
              type: 'video',
              url,
            });
          } else if ((url || '').toLowerCase().endsWith('.pdf') || node.type === 'pdf') {
            navigation.push('Viewer', { nodeId: node.id, title: node.name, type: 'pdf', url });
          } else {
            navigation.push('Viewer', { nodeId: node.id, title: node.name, type: node.type, url });
          }
        }}
      />

      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: bottomPad,
            paddingTop: 8,
            minHeight: BOTTOM_BAR_BASE + bottomPad,
          },
        ]}
      >
        <TouchableOpacity style={styles.navItem} activeOpacity={0.9}>
          <Icon name="home" size={22 * scale} color="#166534" />
          <Text style={[styles.navTextActive, { fontSize: 12 * scale }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('AI')}>
          <Icon name="robot" size={28 * scale} color="#195ed2" />
          <Text style={[styles.navTextSoon, { fontSize: 12 * scale }]}>AI coming soon</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('Contact')}>
          <Icon name="contacts" size={22 * scale} color="#166534" />
          <Text style={[styles.navTextActive, { fontSize: 12 * scale }]}>Contact Us</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center' },

  headerTitle: { fontWeight: 'bold', color: '#fff' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: { flex: 1, color: '#fff' },
  filterButton: { backgroundColor: '#9481ff' },

  featuredCard: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  featuredTextContainer: { flex: 1 },
  featuredTitle: { color: '#fff', fontWeight: 'bold' },
  featuredSubtitle: { color: '#e0e7ff' },

  popularCard: {},
  popularCardImage: { flex: 1, justifyContent: 'flex-end' },
  popularCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16 },
  popularCardTitle: { color: '#fff', fontWeight: 'bold' },

  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultsCell: {},
  searchCard: {
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCardTitle: { textAlign: 'center', fontWeight: '600', color: '#3b0764' },
  noResultsText: { textAlign: 'center', color: '#6b7280' },

  bottomNav: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navItem: { alignItems: 'center' },
  navTextActive: { color: '#166534', fontWeight: '600', marginTop: 4 },
  navTextSoon: { color: '#195ed2', marginTop: 4 },
});
