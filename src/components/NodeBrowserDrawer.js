// import React, { useEffect, useRef, useState } from 'react';
// import {
//     View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ActivityIndicator, Animated, Dimensions, Easing, ScrollView
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import firestore from '@react-native-firebase/firestore';

// const NODES = firestore().collection('nodes');

// // Adjust to match your schema. We'll treat anything NOT 'folder' as a "file/topic".
// // If you want to be explicit, use type IN with this list.
// const FILE_TYPES = ['video', 'pdf', 'file', 'document', 'link'];

// async function fetchChildren(parentId = null) {
//     // folders
//     const folderSnap = await NODES
//         .where('parentId', '==', parentId)
//         .where('type', '==', 'folder')
//         .orderBy('order', 'asc')
//         .get();
//     const folders = folderSnap.docs.map(d => ({ id: d.id, ...d.data() }));

//     // files (videos/topics/etc.). Use "in" with up to 10 values.
//     const batches = [];
//     if (FILE_TYPES.length) {
//         const fileSnap = await NODES
//             .where('parentId', '==', parentId)
//             .where('type', 'in', FILE_TYPES.slice(0, 10))
//             .orderBy('order', 'asc')
//             .get();
//         batches.push(...fileSnap.docs.map(d => ({ id: d.id, ...d.data() })));
//     }

//     return { folders, files: batches };
// }

// /** A single tree node (folder row with chevron + its children) */
// function TreeFolder({ node, level, onOpenFile }) {
//     const [expanded, setExpanded] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [folders, setFolders] = useState([]);
//     const [files, setFiles] = useState([]);

//     const toggle = async () => {
//         if (!expanded) {
//             setLoading(true);
//             try {
//                 const { folders: f, files: t } = await fetchChildren(node.id);
//                 setFolders(f);
//                 setFiles(t);
//             } finally {
//                 setLoading(false);
//             }
//         }
//         setExpanded(prev => !prev);
//     };

//     return (
//         <View>
//             <TouchableOpacity style={[styles.row, { paddingLeft: 12 + level * 14 }]} onPress={toggle}>
//                 <View style={styles.rowLeft}>
//                     <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={20} color="#4b5563" />
//                     <Icon name="folder" size={20} color="#7b61ff" />
//                     <Text style={styles.rowText} numberOfLines={1}>{node.name}</Text>
//                 </View>
//             </TouchableOpacity>

//             {expanded && (
//                 <View>
//                     {loading ? (
//                         <View style={{ paddingLeft: 12 + (level + 1) * 14, paddingVertical: 8 }}>
//                             <ActivityIndicator size="small" color="#7b61ff" />
//                         </View>
//                     ) : (
//                         <>
//                             {/* child folders */}
//                             {folders.map((f) => (
//                                 <TreeFolder key={f.id} node={f} level={level + 1} onOpenFile={onOpenFile} />
//                             ))}
//                             {/* child files/topics */}
//                             {files.map((file) => (
//                                 <TouchableOpacity
//                                     key={file.id}
//                                     style={[styles.row, { paddingLeft: 12 + (level + 1) * 14 }]}
//                                     onPress={() => onOpenFile?.(file)}
//                                 >
//                                     <View style={styles.rowLeft}>
//                                         <View style={{ width: 20 }} />{/* keeps alignment with chevron slot */}
//                                         <Icon
//                                             name={
//                                                 file.type === 'video' ? 'play-circle-outline'
//                                                     : file.type === 'pdf' ? 'file-pdf-box'
//                                                         : 'file-document-outline'
//                                             }
//                                             size={20}
//                                             color={file.type === 'video' ? '#ef4444' : '#6b7280'}
//                                         />
//                                         <Text style={styles.rowText} numberOfLines={1}>{file.name}</Text>
//                                     </View>
//                                 </TouchableOpacity>
//                             ))}
//                             {folders.length === 0 && files.length === 0 && (
//                                 <Text style={[styles.emptyText, { paddingLeft: 12 + (level + 1) * 14 }]}>Empty</Text>
//                             )}
//                         </>
//                     )}
//                 </View>
//             )}
//         </View>
//     );
// }

// /** The slide-in left drawer that shows the root tree */
// export function NodeBrowserDrawer({ visible, onClose, onOpenFile }) {
//     const [loadingRoot, setLoadingRoot] = useState(false);
//     const [rootFolders, setRootFolders] = useState([]);
//     const [rootFiles, setRootFiles] = useState([]);

//     // slide animation
//     const { width } = Dimensions.get('window');
//     const drawerW = Math.min(width * 0.88, 360);
//     const animX = useRef(new Animated.Value(-drawerW)).current;

//     useEffect(() => {
//         if (!visible) return;
//         const load = async () => {
//             setLoadingRoot(true);
//             try {
//                 const { folders, files } = await fetchChildren(null);
//                 setRootFolders(folders);
//                 setRootFiles(files); // videos etc. at root
//             } finally {
//                 setLoadingRoot(false);
//             }
//         };
//         load();
//     }, [visible]);

//     useEffect(() => {
//         Animated.timing(animX, {
//             toValue: visible ? 0 : -drawerW,
//             duration: 240,
//             easing: Easing.out(Easing.cubic),
//             useNativeDriver: true,
//         }).start();
//     }, [visible, animX, drawerW]);

//     return (
//         <Modal
//             visible={visible}
//             transparent
//             animationType="none"
//             presentationStyle="overFullScreen"
//             onRequestClose={onClose}
//         >
//             {/* Scrim */}
//             <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

//             {/* Drawer */}
//             <Animated.View style={[styles.drawer, { width: drawerW, transform: [{ translateX: animX }] }]}>
//                 {/* Header */}
//                 <View style={styles.drawerHeader}>
//                     <Text style={styles.drawerTitle}>Browse</Text>
//                     <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
//                         <Icon name="close" size={22} color="#111" />
//                     </TouchableOpacity>
//                 </View>

//                 {/* Content */}
//                 {loadingRoot ? (
//                     <View style={styles.loader}><ActivityIndicator size="small" color="#7b61ff" /></View>
//                 ) : (
//                     <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
//                         {/* Root folders */}
//                         {rootFolders.map((folder) => (
//                             <TreeFolder key={folder.id} node={folder} level={0} onOpenFile={onOpenFile} />
//                         ))}

//                         {/* Root files (videos/topics at root) */}
//                         {rootFiles.length > 0 && (
//                             <>
//                                 <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Topics</Text>
//                                 {rootFiles.map((file) => (
//                                     <TouchableOpacity
//                                         key={file.id}
//                                         style={[styles.row, { paddingLeft: 12 + 0 * 14 }]}
//                                         onPress={() => onOpenFile?.(file)}
//                                     >
//                                         <View style={styles.rowLeft}>
//                                             <View style={{ width: 20 }} />
//                                             <Icon
//                                                 name={
//                                                     file.type === 'video' ? 'play-circle-outline'
//                                                         : file.type === 'pdf' ? 'file-pdf-box'
//                                                             : 'file-document-outline'
//                                                 }
//                                                 size={20}
//                                                 color={file.type === 'video' ? '#ef4444' : '#6b7280'}
//                                             />
//                                             <Text style={styles.rowText} numberOfLines={1}>{file.name}</Text>
//                                         </View>
//                                     </TouchableOpacity>
//                                 ))}
//                             </>
//                         )}

//                         {rootFolders.length === 0 && rootFiles.length === 0 && (
//                             <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
//                                 <Text style={styles.emptyText}>Nothing here yet</Text>
//                             </View>
//                         )}
//                     </ScrollView>
//                 )}
//             </Animated.View>
//         </Modal>
//     );
// }

// const styles = StyleSheet.create({
//     backdrop: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.32)',
//     },
//     drawer: {
//         position: 'absolute',
//         left: 0,
//         top: 0,
//         bottom: 0,
//         backgroundColor: '#fff',
//         borderTopRightRadius: 16,
//         borderBottomRightRadius: 16,
//         elevation: 8,
//         shadowColor: '#000',
//         shadowOpacity: 0.15,
//         shadowRadius: 10,
//         shadowOffset: { width: 0, height: 4 },
//     },
//     drawerHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 14,
//         paddingTop: 16,
//         paddingBottom: 12,
//         borderBottomColor: '#f0f2f5',
//         borderBottomWidth: 1,
//     },
//     drawerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

//     sectionTitle: {
//         fontSize: 12,
//         color: '#6b7280',
//         marginTop: 10,
//         marginBottom: 6,
//         paddingHorizontal: 14,
//         fontWeight: '700',
//         textTransform: 'uppercase',
//     },

//     row: {
//         paddingVertical: 10,
//     },
//     rowLeft: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         paddingRight: 12,
//     },
//     rowText: { fontSize: 14, color: '#111', flexShrink: 1 },
//     loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

//     emptyText: { fontSize: 12, color: '#9aa3b2' },
// });


// src/components/NodeBrowserDrawer.js
import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
    ActivityIndicator, Animated, Dimensions, Easing, ScrollView, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

const NODES = firestore().collection('nodes');
const FILE_TYPES = ['video', 'pdf', 'file', 'document', 'link'];

// --- data helpers ---
async function fetchChildren(parentId = null) {
    // folders
    const folderSnap = await NODES
        .where('parentId', '==', parentId)
        .where('type', '==', 'folder')
        .orderBy('order', 'asc')
        .get();
    const folders = folderSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // files
    let files = [];
    if (FILE_TYPES.length) {
        const fileSnap = await NODES
            .where('parentId', '==', parentId)
            .where('type', 'in', FILE_TYPES.slice(0, 10))
            .orderBy('order', 'asc')
            .get();
        files = fileSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return { folders, files };
}

// --- tree folder row ---
function TreeFolder({ node, level, onOpenFile, onOpenFolder }) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);

    const levelIndent = 12 + level * 14; // smaller, consistent indent

    const toggle = async () => {
        if (!expanded) {
            setLoading(true);
            try {
                const { folders: f, files: t } = await fetchChildren(node.id);
                setFolders(f);
                setFiles(t);
            } finally {
                setLoading(false);
            }
        }
        setExpanded(prev => !prev);
    };

    return (
        <View>
            {/* One compact row: chevron + folder icon + name all inline */}
            <View style={[styles.row, { paddingLeft: levelIndent }]}>
                <TouchableOpacity onPress={toggle} style={styles.chevronBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={20} color="#4b5563" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.rowLeft}
                    activeOpacity={0.7}
                    onPress={() => onOpenFolder?.(node)}
                >
                    <Icon name="folder" size={20} color="#195ed2" style={{ marginRight: 6 }} />
                    <Text style={styles.rowText} numberOfLines={1}>{node.name}</Text>
                </TouchableOpacity>
            </View>

            {/* Children */}
            {expanded && (
                <View>
                    {loading ? (
                        <View style={{ paddingLeft: levelIndent + 20, paddingVertical: 6 }}>
                            <ActivityIndicator size="small" color="#7b61ff" />
                        </View>
                    ) : (
                        <>
                            {folders.map((f) => (
                                <TreeFolder
                                    key={f.id}
                                    node={f}
                                    level={level + 1}
                                    onOpenFile={onOpenFile}
                                    onOpenFolder={onOpenFolder}
                                />
                            ))}

                            {files.map((file) => (
                                <TouchableOpacity
                                    key={file.id}
                                    style={[styles.row, { paddingLeft: levelIndent + 20 }]}
                                    onPress={() => onOpenFile?.(file)}
                                    activeOpacity={0.7}
                                >
                                    {/* keep a small spacer to align with chevron slot */}
                                    <View style={{ width: 20 }} />
                                    <Icon
                                        name={
                                            file.type === 'video' ? 'play-circle-outline'
                                                : file.type === 'pdf' ? 'file-pdf-box'
                                                    : 'file-document-outline'
                                        }
                                        size={18}
                                        color={file.type === 'video' ? '#ef4444' : '#6b7280'}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={styles.fileText} numberOfLines={1}>{file.name}</Text>
                                </TouchableOpacity>
                            ))}

                            {folders.length === 0 && files.length === 0 && (
                                <Text style={[styles.emptyText, { paddingLeft: levelIndent + 20, paddingVertical: 4 }]}>Empty</Text>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

export function NodeBrowserDrawer({ visible, onClose, onOpenFile, onOpenFolder, onNavigate, userName = 'User' }) {
    const [loadingRoot, setLoadingRoot] = useState(false);
    const [rootFolders, setRootFolders] = useState([]);
    const [rootFiles, setRootFiles] = useState([]);

    const { width } = Dimensions.get('window');
    const drawerW = Math.min(width * 0.88, 360);
    const animX = useRef(new Animated.Value(-drawerW)).current;
    const pendingRouteRef = useRef(null);
    useEffect(() => {
        if (!visible && pendingRouteRef.current) {
            // micro-fallback if onDismiss didn’t fire
            requestAnimationFrame(() => {
                if (pendingRouteRef.current) {
                    onNavigate?.(pendingRouteRef.current);
                    pendingRouteRef.current = null;
                }
            });
        }
        const load = async () => {
            setLoadingRoot(true);
            try {
                const { folders, files } = await fetchChildren(null);
                setRootFolders(folders);
                setRootFiles(files);
            } finally {
                setLoadingRoot(false);
            }
        };
        load();
    }, [visible]);

    useEffect(() => {
        Animated.timing(animX, {
            toValue: visible ? 0 : -drawerW,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [visible, animX, drawerW]);
    const go = (route) => {
        pendingRouteRef.current = route; // remember where to go
        onClose?.();                     // close immediately
    };


    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
        // keep your onDismiss trick if you navigate after close for quick menu
        >
            <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />
            <Animated.View style={[styles.drawer, { width: drawerW, transform: [{ translateX: animX }] }]}>

                {/* Header + quick menu ... keep as-is */}
                {/* Header (keep yours) */}
                <View style={styles.drawerHeader}>
                    <View>
                        <Text style={styles.hello}>Hello, {userName || 'User'}</Text>
                        <Text style={styles.drawerTitle}>Main Menu</Text>
                    </View>
                    <TouchableOpacity onPress={onClose}>
                        <Icon name="close" size={22} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* ✅ QUICK MENU — this is what shows Home / AI / Contact */}
                <View style={styles.quickMenu}>
                    <TouchableOpacity style={styles.quickRow} onPress={() => go('Home')}>
                        <View style={styles.rowLeft}>
                            <Icon name="home" size={20} color="#166534" />
                            <Text style={styles.rowText}>Home</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#9aa3b2" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickRow} onPress={() => go('AI')}>
                        <View style={styles.rowLeft}>
                            <Icon name="robot" size={20} color='#195ed2' />
                            <Text style={styles.rowText}>AI coming soon</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#9aa3b2" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickRow} onPress={() => go('Contact')}>
                        <View style={styles.rowLeft}>
                            <Icon name="contacts" size={20} color="#166534" />
                            <Text style={styles.rowText}>Contact Us</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#9aa3b2" />
                    </TouchableOpacity>
                </View>

                {loadingRoot ? (
                    <View style={styles.loader}><ActivityIndicator size="small" color="#195ed2" /></View>
                ) : (
                    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                        {/* Root folders */}
                        {rootFolders.map((folder) => (
                            <TreeFolder
                                key={folder.id}
                                node={folder}
                                level={0}
                                onOpenFile={onOpenFile}
                                onOpenFolder={onOpenFolder}   // 👈 pass down
                            />
                        ))}

                        {/* Root files */}
                        {rootFiles.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Topics</Text>
                                {rootFiles.map((file) => (
                                    <TouchableOpacity
                                        key={file.id}
                                        style={[styles.row, { paddingLeft: 12 }]}
                                        onPress={() => onOpenFile?.(file)}
                                    >
                                        <View style={styles.rowLeft}>
                                            <View style={{ width: 24 }} />
                                            <Icon
                                                name={
                                                    file.type === 'video' ? 'play-circle-outline'
                                                        : file.type === 'pdf' ? 'file-pdf-box'
                                                            : 'file-document-outline'
                                                }
                                                size={20}
                                                color={file.type === 'video' ? '#ef4444' : '#6b7280'}
                                            />
                                            <Text style={styles.rowText} numberOfLines={1} color="#195ed2">{file.name}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {rootFolders.length === 0 && rootFiles.length === 0 && (
                            <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                                <Text style={styles.emptyText}>Nothing here yet</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </Animated.View>
        </Modal>
    );
}
const styles = StyleSheet.create({
    /* Overlay behind the drawer */
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.45)', // soft dark overlay
    },

    /* Drawer base container */
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '88%',
        maxWidth: 360,
        backgroundColor: '#ffffff',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },

    /* Header with greeting */
    drawerHeader: {
        paddingHorizontal: 20,
        paddingTop: 26,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#f9fafb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hello: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    drawerTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
        marginTop: 2,
        letterSpacing: 0.7,
    },

    /* --- QUICK MENU --- */
    quickMenu: {
        margin: 14,
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    quickRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    quickRowLast: {
        borderBottomWidth: 0,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rowText: {
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '500',
    },

    /* --- FIRESTORE SECTION --- */
    sectionTitle: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingRight: 16,
    },
    chevronBtn: {
        width: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 2,
    },
    rowLeftTree: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minHeight: 26,
    },
    rowTextTree: {
        fontSize: 14,
        color: '#111',
        flexShrink: 1,
    },
    fileText: {
        fontSize: 13,
        color: '#111',
        flexShrink: 1,
    },
    folderRowPressed: {
        backgroundColor: '#f3f4f6',
    },

    /* Loading or empty state */
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: {
        fontSize: 13,
        color: '#9ca3af',
        paddingLeft: 28,
        paddingVertical: 6,
    },

    /* Divider */
    dividerLine: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 16,
        marginVertical: 10,
    },
});





// // src/components/NodeBrowserDrawer.js
// import React, { useEffect, useRef, useState } from 'react';
// import {
//     View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
//     ActivityIndicator, Animated, Dimensions, Easing, ScrollView, Alert
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import firestore from '@react-native-firebase/firestore';

// const NODES = firestore().collection('nodes');
// const FILE_TYPES = ['video', 'pdf', 'file', 'document', 'link'];

// // --- data helpers ---
// async function fetchChildren(parentId = null) {
//     // folders
//     const folderSnap = await NODES
//         .where('parentId', '==', parentId)
//         .where('type', '==', 'folder')
//         .orderBy('order', 'asc')
//         .get();
//     const folders = folderSnap.docs.map(d => ({ id: d.id, ...d.data() }));

//     // files
//     let files = [];
//     if (FILE_TYPES.length) {
//         const fileSnap = await NODES
//             .where('parentId', '==', parentId)
//             .where('type', 'in', FILE_TYPES.slice(0, 10))
//             .orderBy('order', 'asc')
//             .get();
//         files = fileSnap.docs.map(d => ({ id: d.id, ...d.data() }));
//     }
//     return { folders, files };
// }

// // --- tree folder row ---
// function TreeFolder({ node, level, onOpenFile, onOpenFolder }) {
//     const [expanded, setExpanded] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [folders, setFolders] = useState([]);
//     const [files, setFiles] = useState([]);

//     const levelIndent = 12 + level * 14; // smaller, consistent indent

//     const toggle = async () => {
//         if (!expanded) {
//             setLoading(true);
//             try {
//                 const { folders: f, files: t } = await fetchChildren(node.id);
//                 setFolders(f);
//                 setFiles(t);
//             } finally {
//                 setLoading(false);
//             }
//         }
//         setExpanded(prev => !prev);
//     };

//     return (
//         <View>
//             {/* One compact row: chevron + folder icon + name all inline */}
//             <View style={[styles.row, { paddingLeft: levelIndent }]}>
//                 <TouchableOpacity onPress={toggle} style={styles.chevronBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
//                     <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={20} color="#4b5563" />
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                     style={styles.rowLeft}
//                     activeOpacity={0.7}
//                     onPress={() => onOpenFolder?.(node)}
//                 >
//                     <Icon name="folder" size={20} color="#7b61ff" style={{ marginRight: 6 }} />
//                     <Text style={styles.rowText} numberOfLines={1}>{node.name}</Text>
//                 </TouchableOpacity>
//             </View>

//             {/* Children */}
//             {expanded && (
//                 <View>
//                     {loading ? (
//                         <View style={{ paddingLeft: levelIndent + 20, paddingVertical: 6 }}>
//                             <ActivityIndicator size="small" color="#7b61ff" />
//                         </View>
//                     ) : (
//                         <>
//                             {folders.map((f) => (
//                                 <TreeFolder
//                                     key={f.id}
//                                     node={f}
//                                     level={level + 1}
//                                     onOpenFile={onOpenFile}
//                                     onOpenFolder={onOpenFolder}
//                                 />
//                             ))}

//                             {files.map((file) => (
//                                 <TouchableOpacity
//                                     key={file.id}
//                                     style={[styles.row, { paddingLeft: levelIndent + 20 }]}
//                                     onPress={() => onOpenFile?.(file)}
//                                     activeOpacity={0.7}
//                                 >
//                                     {/* keep a small spacer to align with chevron slot */}
//                                     <View style={{ width: 20 }} />
//                                     <Icon
//                                         name={
//                                             file.type === 'video' ? 'play-circle-outline'
//                                                 : file.type === 'pdf' ? 'file-pdf-box'
//                                                     : 'file-document-outline'
//                                         }
//                                         size={18}
//                                         color={file.type === 'video' ? '#ef4444' : '#6b7280'}
//                                         style={{ marginRight: 6 }}
//                                     />
//                                     <Text style={styles.fileText} numberOfLines={1}>{file.name}</Text>
//                                 </TouchableOpacity>
//                             ))}

//                             {folders.length === 0 && files.length === 0 && (
//                                 <Text style={[styles.emptyText, { paddingLeft: levelIndent + 20, paddingVertical: 4 }]}>Empty</Text>
//                             )}
//                         </>
//                     )}
//                 </View>
//             )}
//         </View>
//     );
// }

// //     return (
// //         <View>
// //             <TouchableOpacity style={[styles.row, { paddingLeft: 12 + level * 14 }]} onPress={toggle}>
// //                 <View style={styles.rowLeft}>
// //                     <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={20} color="#4b5563" />
// //                     <Icon name="folder" size={20} color="#7b61ff" />
// //                     <Text style={styles.rowText} numberOfLines={1}>{node.name}</Text>
// //                 </View>
// //             </TouchableOpacity>

// //             {expanded && (
// //                 <View>
// //                     {loading ? (
// //                         <View style={{ paddingLeft: 12 + (level + 1) * 14, paddingVertical: 8 }}>
// //                             <ActivityIndicator size="small" color="#7b61ff" />
// //                         </View>
// //                     ) : (
// //                         <>
// //                             {folders.map((f) => (
// //                                 <TreeFolder key={f.id} node={f} level={level + 1} onOpenFile={onOpenFile} />
// //                             ))}

// //                             {files.map((file) => (
// //                                 <TouchableOpacity
// //                                     key={file.id}
// //                                     style={[styles.row, { paddingLeft: 12 + (level + 1) * 14 }]}
// //                                     onPress={() => onOpenFile?.(file)}
// //                                 >
// //                                     <View style={styles.rowLeft}>
// //                                         <View style={{ width: 20 }} />
// //                                         <Icon
// //                                             name={
// //                                                 file.type === 'video' ? 'play-circle-outline'
// //                                                     : file.type === 'pdf' ? 'file-pdf-box'
// //                                                         : 'file-document-outline'
// //                                             }
// //                                             size={20}
// //                                             color={file.type === 'video' ? '#ef4444' : '#6b7280'}
// //                                         />
// //                                         <Text style={styles.rowText} numberOfLines={1}>{file.name}</Text>
// //                                     </View>
// //                                 </TouchableOpacity>
// //                             ))}

// //                             {folders.length === 0 && files.length === 0 && (
// //                                 <Text style={[styles.emptyText, { paddingLeft: 12 + (level + 1) * 14 }]}>Empty</Text>
// //                             )}
// //                         </>
// //                     )}
// //                 </View>
// //             )}
// //         </View>
// //     );
// // }

// /**
//  * Drawer with:
//  * - Greeting + Quick Menu (Home, AI coming soon, Contact Us)
//  * - Browse tree (folders + files)
//  *
//  * Props:
//  *  visible: boolean
//  *  onClose: () => void
//  *  onOpenFile?: (node) => void
//  *  onNavigate?: (routeName: string) => void   // <-- NEW
//  *  userName?: string                           // <-- NEW (defaults to "User")
//  */
// export function NodeBrowserDrawer({ visible, onClose, onOpenFile, onOpenFolder, onNavigate, userName = 'User' }) {
//     const [loadingRoot, setLoadingRoot] = useState(false);
//     const [rootFolders, setRootFolders] = useState([]);
//     const [rootFiles, setRootFiles] = useState([]);

//     const { width } = Dimensions.get('window');
//     const drawerW = Math.min(width * 0.88, 360);
//     const animX = useRef(new Animated.Value(-drawerW)).current;
//     const pendingRouteRef = useRef(null);
//     useEffect(() => {
//         if (!visible && pendingRouteRef.current) {
//             // micro-fallback if onDismiss didn’t fire
//             requestAnimationFrame(() => {
//                 if (pendingRouteRef.current) {
//                     onNavigate?.(pendingRouteRef.current);
//                     pendingRouteRef.current = null;
//                 }
//             });
//         }
//         const load = async () => {
//             setLoadingRoot(true);
//             try {
//                 const { folders, files } = await fetchChildren(null);
//                 setRootFolders(folders);
//                 setRootFiles(files);
//             } finally {
//                 setLoadingRoot(false);
//             }
//         };
//         load();
//     }, [visible]);

//     useEffect(() => {
//         Animated.timing(animX, {
//             toValue: visible ? 0 : -drawerW,
//             duration: 240,
//             easing: Easing.out(Easing.cubic),
//             useNativeDriver: true,
//         }).start();
//     }, [visible, animX, drawerW]);

//     // quick menu actions
//     // const go = (route) => {
//     //     if (route === 'AI') {
//     //         Alert.alert('AI', 'AI coming soon');
//     //         return;
//     //     }
//     //     onClose?.();
//     //     setTimeout(() => {
//     //         onNavigate?.(route);
//     //     }, 0.10); // small delay to let the drawer finish closing
//     // };
//     const go = (route) => {
//         // if (route === 'AI') {
//         //     Alert.alert('AI', 'AI coming soon');
//         //     return;
//         // }
//         pendingRouteRef.current = route; // remember where to go
//         onClose?.();                     // close immediately
//     };


//     return (
//         <Modal
//             visible={visible}
//             transparent
//             animationType="none"
//             presentationStyle="overFullScreen"
//             onRequestClose={onClose}
//         // keep your onDismiss trick if you navigate after close for quick menu
//         >
//             <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />
//             <Animated.View style={[styles.drawer, { width: drawerW, transform: [{ translateX: animX }] }]}>

//                 {/* Header + quick menu ... keep as-is */}
//                 {/* Header (keep yours) */}
//                 <View style={styles.drawerHeader}>
//                     <View>
//                         <Text style={styles.hello}>Hello, {userName || 'User'}</Text>
//                         <Text style={styles.drawerTitle}>Main Menu</Text>
//                     </View>
//                     <TouchableOpacity onPress={onClose}>
//                         <Icon name="close" size={22} color="#111" />
//                     </TouchableOpacity>
//                 </View>

//                 {/* ✅ QUICK MENU — this is what shows Home / AI / Contact */}
//                 <View style={styles.quickMenu}>
//                     <TouchableOpacity style={styles.quickRow} onPress={() => go('Home')}>
//                         <View style={styles.rowLeft}>
//                             <Icon name="home" size={20} color="#166534" />
//                             <Text style={styles.rowText}>Home</Text>
//                         </View>
//                         <Icon name="chevron-right" size={20} color="#9aa3b2" />
//                     </TouchableOpacity>

//                     <TouchableOpacity style={styles.quickRow} onPress={() => go('AI')}>
//                         <View style={styles.rowLeft}>
//                             <Icon name="robot" size={20} color="#7b61ff" />
//                             <Text style={styles.rowText}>AI coming soon</Text>
//                         </View>
//                         <Icon name="chevron-right" size={20} color="#9aa3b2" />
//                     </TouchableOpacity>

//                     <TouchableOpacity style={styles.quickRow} onPress={() => go('Contact')}>
//                         <View style={styles.rowLeft}>
//                             <Icon name="contacts" size={20} color="#166534" />
//                             <Text style={styles.rowText}>Contact Us</Text>
//                         </View>
//                         <Icon name="chevron-right" size={20} color="#9aa3b2" />
//                     </TouchableOpacity>
//                 </View>

//                 {loadingRoot ? (
//                     <View style={styles.loader}><ActivityIndicator size="small" color="#7b61ff" /></View>
//                 ) : (
//                     <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
//                         {/* Root folders */}
//                         {rootFolders.map((folder) => (
//                             <TreeFolder
//                                 key={folder.id}
//                                 node={folder}
//                                 level={0}
//                                 onOpenFile={onOpenFile}
//                                 onOpenFolder={onOpenFolder}   // 👈 pass down
//                             />
//                         ))}

//                         {/* Root files */}
//                         {rootFiles.length > 0 && (
//                             <>
//                                 <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Topics</Text>
//                                 {rootFiles.map((file) => (
//                                     <TouchableOpacity
//                                         key={file.id}
//                                         style={[styles.row, { paddingLeft: 12 }]}
//                                         onPress={() => onOpenFile?.(file)}
//                                     >
//                                         <View style={styles.rowLeft}>
//                                             <View style={{ width: 24 }} />
//                                             <Icon
//                                                 name={
//                                                     file.type === 'video' ? 'play-circle-outline'
//                                                         : file.type === 'pdf' ? 'file-pdf-box'
//                                                             : 'file-document-outline'
//                                                 }
//                                                 size={20}
//                                                 color={file.type === 'video' ? '#ef4444' : '#6b7280'}
//                                             />
//                                             <Text style={styles.rowText} numberOfLines={1}>{file.name}</Text>
//                                         </View>
//                                     </TouchableOpacity>
//                                 ))}
//                             </>
//                         )}

//                         {rootFolders.length === 0 && rootFiles.length === 0 && (
//                             <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
//                                 <Text style={styles.emptyText}>Nothing here yet</Text>
//                             </View>
//                         )}
//                     </ScrollView>
//                 )}
//             </Animated.View>
//         </Modal>
//     );
// }
// const styles = StyleSheet.create({
//     backdrop: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.32)',
//     },
//     drawer: {
//         position: 'absolute',
//         left: 0, top: 0, bottom: 0,
//         backgroundColor: '#fff',
//         borderTopRightRadius: 16,
//         borderBottomRightRadius: 16,
//         elevation: 8,
//         shadowColor: '#000',
//         shadowOpacity: 0.15,
//         shadowRadius: 10,
//         shadowOffset: { width: 0, height: 4 },
//     },
//     drawerHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 14,
//         paddingTop: 16,
//         paddingBottom: 12,
//         borderBottomColor: '#f0f2f5',
//         borderBottomWidth: 1,
//     },
//     hello: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
//     drawerTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },

//     quickMenu: {
//         paddingVertical: 6,
//         borderBottomColor: '#f0f2f5',
//         borderBottomWidth: 1,
//         marginBottom: 6,
//     },
//     quickRow: {
//         paddingVertical: 10,
//         paddingHorizontal: 14,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//     },

//     sectionTitle: {
//         fontSize: 12,
//         color: '#6b7280',
//         marginTop: 10,
//         marginBottom: 6,
//         paddingHorizontal: 14,
//         fontWeight: '700',
//         textTransform: 'uppercase',
//     },

//     row: { paddingVertical: 10 },
//     rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 },
//     rowText: { fontSize: 14, color: '#111', flexShrink: 1 },

//     loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//     emptyText: { fontSize: 12, color: '#9aa3b2' },

//     row: {
//         paddingVertical: 8,               // tighter
//         paddingRight: 12,
//     },
//     rowLeft: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         flex: 1,                          // name hugs the row and ellipsizes
//         minHeight: 24,
//     },
//     rowText: {
//         fontSize: 14,
//         color: '#111',
//         flexShrink: 1,
//     },
//     fileText: {
//         fontSize: 13,
//         color: '#111',
//         flexShrink: 1,
//     },
//     chevronBtn: {
//         width: 24,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginRight: 2,                   // tiny gap before folder icon
//     },

// });
