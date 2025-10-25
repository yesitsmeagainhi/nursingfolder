// src/components/NodeBrowserSheet.js
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

const NODES = firestore().collection('nodes');
// node schema:
// { id, name, type: 'folder' | 'file', parentId: string|null, order?: number, url?: string, provider?: string }

export function NodeBrowserSheet({ visible, onClose, onOpenFile }) {
    const [loading, setLoading] = useState(false);
    const [stack, setStack] = useState([{ id: null, name: 'All' }]); // breadcrumb stack
    const current = stack[stack.length - 1];
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);

    // fetch children whenever current changes
    useEffect(() => {
        const pid = current?.id ?? null;

        const load = async () => {
            setLoading(true);
            try {
                // FOLDERS
                const folderSnap = await NODES
                    .where('parentId', '==', pid)
                    .where('type', '==', 'folder')
                    .orderBy('order', 'asc')
                    .get();
                const f = folderSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // FILES
                const fileSnap = await NODES
                    .where('parentId', '==', pid)
                    .where('type', '==', 'file')
                    .orderBy('order', 'asc')
                    .get();
                const t = fileSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                setFolders(f);
                setFiles(t);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [current?.id]);

    const goInto = (node) => {
        if (node.type === 'folder') {
            setStack(prev => [...prev, { id: node.id, name: node.name }]);
        } else {
            onOpenFile?.(node);
        }
    };

    const goBack = () => {
        if (stack.length > 1) setStack(prev => prev.slice(0, -1));
        else onClose?.();
    };

    const FolderItem = ({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => goInto(item)}>
            <View style={styles.rowLeft}>
                <Icon name="folder" size={22} color="#7b61ff" />
                <Text style={styles.rowText} numberOfLines={1}>{item.name}</Text>
            </View>
            <Icon name="chevron-right" size={22} color="#aaa" />
        </TouchableOpacity>
    );

    const FileItem = ({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => goInto(item)}>
            <View style={styles.rowLeft}>
                <Icon name="file-document" size={20} color="#5c6b7a" />
                <Text style={styles.rowText} numberOfLines={1}>{item.name}</Text>
            </View>
            <Icon name="play-circle-outline" size={22} color="#aaa" />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
        >
            <View style={styles.sheetBackdrop}>
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                            <Icon name={stack.length > 1 ? 'arrow-left' : 'close'} size={22} color="#111" />
                        </TouchableOpacity>

                        <View style={styles.breadcrumbWrap}>
                            <Text style={styles.bcRoot}>All</Text>
                            {stack.slice(1).map((s) => (
                                <View key={s.id || 'root'} style={styles.bcSeg}>
                                    <Icon name="chevron-right" size={16} color="#777" />
                                    <Text style={styles.bcText} numberOfLines={1}>{s.name}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ width: 40 }} />
                    </View>

                    {/* Body */}
                    {loading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator size="small" color="#7b61ff" />
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            {/* Folders */}
                            {folders.length > 0 && (
                                <>
                                    <Text style={styles.sectionTitle}>Folders</Text>
                                    <FlatList
                                        data={folders}
                                        keyExtractor={(it) => it.id}
                                        renderItem={FolderItem}
                                        ItemSeparatorComponent={() => <View style={styles.sep} />}
                                    />
                                </>
                            )}

                            {/* Files / Topics */}
                            {files.length > 0 && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: folders.length ? 12 : 0 }]}>
                                        Topics
                                    </Text>
                                    <FlatList
                                        data={files}
                                        keyExtractor={(it) => it.id}
                                        renderItem={FileItem}
                                        ItemSeparatorComponent={() => <View style={styles.sep} />}
                                    />
                                </>
                            )}

                            {folders.length === 0 && files.length === 0 && (
                                <View style={styles.empty}>
                                    <Icon name="folder-open-outline" size={28} color="#b9bed1" />
                                    <Text style={styles.emptyText}>Nothing here yet</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
    },
    sheet: {
        height: '70%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingBottom: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomColor: '#f0f2f5',
        borderBottomWidth: 1,
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    breadcrumbWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
    bcRoot: { fontSize: 14, color: '#111', fontWeight: '700' },
    bcSeg: { flexDirection: 'row', alignItems: 'center' },
    bcText: { fontSize: 13, color: '#444', maxWidth: 180 },

    // Sections & rows
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
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center' },
    rowText: { fontSize: 14, color: '#111', marginLeft: 10, flexShrink: 1 },
    sep: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 14 },

    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
    emptyText: { fontSize: 12, color: '#9aa3b2', marginTop: 6 },
});
