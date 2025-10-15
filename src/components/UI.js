// src/components/UI.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../utils/map';

export const Card = ({ children, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
    {children}
  </TouchableOpacity>
);

export const Title = ({ children }) => <Text style={styles.title}>{children}</Text>;

export const Pill = ({ children }) => <Text style={styles.pill}>{children}</Text>;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: THEME + '20',
    color: THEME,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '600',
    marginTop: 8,
  },
});
