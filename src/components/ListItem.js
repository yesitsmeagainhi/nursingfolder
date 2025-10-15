// src/components/ListItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ListItem({ icon = 'folder', title, subtitle, onPress, right }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.8}>
      <Icon name={icon} size={22} color="#6b7280" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
      <Icon name="chevron-right" size={22} color="#9ca3af" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  subtitle: { marginTop: 2, color: '#6b7280' },
});
