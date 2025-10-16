// src/screens/CourseDetailsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

const LessonItem = ({ lesson, onPress }) => (
  <TouchableOpacity style={styles.lessonCard} onPress={onPress}>
    <View style={styles.playIconBg}>
      <Icon name="play" size={24} color="#6d28d9" />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.lessonTitle}>{lesson.name}</Text>
      {/* The progress bar is a placeholder for now */}
      <View style={styles.progressBar}>
        <View style={styles.progress} />
      </View>
    </View>
    <Text style={styles.lessonDuration}>10:30</Text>
  </TouchableOpacity>
);

export default function CourseDetailsScreen({ route, navigation }) {
  const { course } = route.params; // Get course data from navigation

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all children (lessons/videos) of this course
  useEffect(() => {
    const q = firestore()
      .collection('nodes')
      .where('parentId', '==', course.id)
      .orderBy('order', 'asc');

    const unsub = q.onSnapshot(
      snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLessons(items);
        setLoading(false);
      },
      err => {
        console.error("Failed to fetch lessons:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [course.id]);

  const openVideo = (video) => {
    navigation.navigate('Viewer', {
      title: video.name,
      type: video.type,
      url: video.url,
      embedUrl: video.embedUrl,
    });
  };

  return (
    <ScrollView style={styles.wrap}>
      {/* Header Image */}
      <Image
        source={{ uri: 'https://img.freepik.com/free-vector/user-interface-design-concept-illustration_114360-1126.jpg' }} // Placeholder image
        style={styles.headerImage}
      />

      <View style={styles.content}>
        {/* Course Info */}
        <Text style={styles.price}>$156.99</Text>
        <Text style={styles.title}>{course.name}</Text>
        <Text style={styles.author}>by Kholon Hossain</Text>
        <Text style={styles.description}>
          User interface is a process which displays a result in the form of a view that can be seen by the user.
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="book-open-variant" size={20} color="#6d28d9" />
            <Text style={styles.statText}>{lessons.length} Lessons</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="clock-outline" size={20} color="#6d28d9" />
            <Text style={styles.statText}>2h 30min</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="file-question-outline" size={20} color="#6d28d9" />
            <Text style={styles.statText}>Quizzes</Text>
          </View>
        </View>

        {/* Lessons List */}
        <Text style={styles.sectionTitle}>Lessons</Text>
        {loading ? (
          <ActivityIndicator color="#6d28d9" style={{ marginTop: 20 }} />
        ) : (
          lessons.map(lesson => (
            <LessonItem key={lesson.id} lesson={lesson} onPress={() => openVideo(lesson)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  headerImage: { width: '100%', height: 220, resizeMode: 'cover' },
  content: { padding: 20 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#6d28d9' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 8 },
  author: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  description: { fontSize: 14, color: '#4b5563', marginTop: 12, lineHeight: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingVertical: 10 },
  statItem: { alignItems: 'center' },
  statText: { color: '#4b5563', marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 10 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  playIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  lessonDuration: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 8,
    width: '80%',
  },
  progress: {
    height: 6,
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
    width: '30%', // Example progress
  },
});