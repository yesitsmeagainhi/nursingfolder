import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ActivityIndicator, Animated, Dimensions, Easing, ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

const NODES = firestore().collection('nodes');

// Adjust to match your schema. We'll treat anything NOT 'folder' as a "file/topic".
// If you want to be explicit, use type IN with this list.
const FILE_TYPES = ['video', 'pdf', 'file', 'document', 'link'];

async function fetchChildren(parentId = null) {
    // folders
    const folderSnap = await NODES
        .where('parentId', '==', parentId)
        .where('type', '==', 'folder')
        .orderBy('order', 'asc')
        .get();
    const folders = folderSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // files (videos/topics/etc.). Use "in" with up to 10 values.
    const batches = [];
    if (FILE_TYPES.length) {
        const fileSnap = await NODES
            .where('parentId', '==', parentId)
            .where('type', 'in', FILE_TYPES.slice(0, 10))
            .orderBy('order', 'asc')
            .get();
        batches.push(...fileSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    return { folders, files: batches };
}

/** A single tree node (folder row with chevron + its children) */
function TreeFolder({ node, level, onOpenFile }) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);

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
            <TouchableOpacity style={[styles.row, { paddingLeft: 12 + level * 14 }]} onPress={toggle}>
                <View style={styles.rowLeft}>
                    <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={20} color="#4b5563" />
                    <Icon name="folder" size={20} color="#7b61ff" />
                    <Text style={styles.rowText} numberOfLines={1}>{node.name}</Text>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View>
                    {loading ? (
                        <View style={{ paddingLeft: 12 + (level + 1) * 14, paddingVertical: 8 }}>
                            <ActivityIndicator size="small" color="#7b61ff" />
                        </View>
                    ) : (
                        <>
                            {/* child folders */}
                            {folders.map((f) => (
                                <TreeFolder key={f.id} node={f} level={level + 1} onOpenFile={onOpenFile} />
                            ))}
                            {/* child files/topics */}
                            {files.map((file) => (
                                <TouchableOpacity
                                    key={file.id}
                                    style={[styles.row, { paddingLeft: 12 + (level + 1) * 14 }]}
                                    onPress={() => onOpenFile?.(file)}
                                >
                                    <View style={styles.rowLeft}>
                                        <View style={{ width: 20 }} />{/* keeps alignment with chevron slot */}
                                        <Icon
                                            name={
                                                file.type === 'video' ? 'play-circle-outline'
                                                    : file.type === 'pdf' ? 'file-pdf-box'
                                                        : 'file-document-outline'
                                            }
                                            size={20}
                                            color={file.type === 'video' ? '#ef4444' : '#6b7280'}
                                        />
                                        <Text style={styles.rowText} numberOfLines={1}>{file.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {folders.length === 0 && files.length === 0 && (
                                <Text style={[styles.emptyText, { paddingLeft: 12 + (level + 1) * 14 }]}>Empty</Text>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

/** The slide-in left drawer that shows the root tree */
export function NodeBrowserDrawer({ visible, onClose, onOpenFile }) {
    const [loadingRoot, setLoadingRoot] = useState(false);
    const [rootFolders, setRootFolders] = useState([]);
    const [rootFiles, setRootFiles] = useState([]);

    // slide animation
    const { width } = Dimensions.get('window');
    const drawerW = Math.min(width * 0.88, 360);
    const animX = useRef(new Animated.Value(-drawerW)).current;

    useEffect(() => {
        if (!visible) return;
        const load = async () => {
            setLoadingRoot(true);
            try {
                const { folders, files } = await fetchChildren(null);
                setRootFolders(folders);
                setRootFiles(files); // videos etc. at root
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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
        >
            {/* Scrim */}
            <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

            {/* Drawer */}
            <Animated.View style={[styles.drawer, { width: drawerW, transform: [{ translateX: animX }] }]}>
                {/* Header */}
                <View style={styles.drawerHeader}>
                    <Text style={styles.drawerTitle}>Browse</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
                        <Icon name="close" size={22} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {loadingRoot ? (
                    <View style={styles.loader}><ActivityIndicator size="small" color="#7b61ff" /></View>
                ) : (
                    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                        {/* Root folders */}
                        {rootFolders.map((folder) => (
                            <TreeFolder key={folder.id} node={folder} level={0} onOpenFile={onOpenFile} />
                        ))}

                        {/* Root files (videos/topics at root) */}
                        {rootFiles.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Topics</Text>
                                {rootFiles.map((file) => (
                                    <TouchableOpacity
                                        key={file.id}
                                        style={[styles.row, { paddingLeft: 12 + 0 * 14 }]}
                                        onPress={() => onOpenFile?.(file)}
                                    >
                                        <View style={styles.rowLeft}>
                                            <View style={{ width: 20 }} />
                                            <Icon
                                                name={
                                                    file.type === 'video' ? 'play-circle-outline'
                                                        : file.type === 'pdf' ? 'file-pdf-box'
                                                            : 'file-document-outline'
                                                }
                                                size={20}
                                                color={file.type === 'video' ? '#ef4444' : '#6b7280'}
                                            />
                                            <Text style={styles.rowText} numberOfLines={1}>{file.name}</Text>
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
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.32)',
    },
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomColor: '#f0f2f5',
        borderBottomWidth: 1,
    },
    drawerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

    sectionTitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 10,
        marginBottom: 6,
        paddingHorizontal: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    row: {
        paddingVertical: 10,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingRight: 12,
    },
    rowText: { fontSize: 14, color: '#111', flexShrink: 1 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    emptyText: { fontSize: 12, color: '#9aa3b2' },
});
