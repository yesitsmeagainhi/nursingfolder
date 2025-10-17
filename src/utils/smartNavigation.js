// src/utils/smartNavigation.js
import React from 'react';
import { BackHandler } from 'react-native';
import { CommonActions, StackActions, useFocusEffect } from '@react-navigation/native';
import { getNode } from '../services/firestore'; // make sure this returns {id,name,type,parentId,breadcrumbs?}

export function openNode(navigation, node) {
    // Normal drill-down within the tree -> PUSH, not navigate
    if (node.type === 'folder') {
        navigation.dispatch(StackActions.push('Explorer', { nodeId: node.id, title: node.name }));
    } else {
        // generic viewer or dedicated video/pdf screens
        navigation.dispatch(StackActions.push('Viewer', { nodeId: node.id, title: node.name }));
    }
}

export async function navigateToNodeById(navigation, nodeId) {
    // Entry from search/notification: rebuild the stack from breadcrumbs
    const node = await getNode(nodeId);
    if (!node) return;

    const crumbs = node.breadcrumbs || []; // [{id,name}, ...] from root -> parent
    const routes = [
        ...crumbs.map(c => ({ name: 'Explorer', params: { nodeId: c.id, title: c.name } })),
        { name: node.type === 'folder' ? 'Explorer' : 'Viewer', params: { nodeId: node.id, title: node.name } }
    ];

    navigation.dispatch(CommonActions.reset({ index: routes.length - 1, routes }));
}

export function useSmartBack(navigation, nodeId) {
    // If no stack history (cold deep-link), go to the node's parent instead of dumping at Home
    useFocusEffect(
        React.useCallback(() => {
            const onBack = async () => {
                if (navigation.canGoBack()) return false; // let RN handle it

                const node = await getNode(nodeId);
                const parent = node?.breadcrumbs?.[node.breadcrumbs.length - 1];
                if (parent) {
                    navigation.replace('Explorer', { nodeId: parent.id, title: parent.name });
                } else {
                    navigation.replace('Home');
                }
                return true;
            };
            BackHandler.addEventListener('hardwareBackPress', onBack);
            return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
        }, [navigation, nodeId])
    );
}
