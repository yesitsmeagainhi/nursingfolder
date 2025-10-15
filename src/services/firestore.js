// src/services/firestore.js
import firestore from '@react-native-firebase/firestore';

// ---- Flat collections ----
const C = {
  courses: 'courses',
  years: 'years',
  subjects: 'subjects',
  subsubjects: 'subsubjects',
  units: 'units',
  subunits: 'subunits',
  videos: 'videos',
};

// Helpers
const mapSnap = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

export const getCourses = async () =>
  mapSnap(await firestore().collection(C.courses).orderBy('order', 'asc').get());

export const getYearsByCourse = async (courseId) =>
  mapSnap(
    await firestore()
      .collection(C.years)
      .where('courseId', '==', courseId)
      .orderBy('order', 'asc')
      .get()
  );

export const getSubjectsByYear = async (courseId, yearId) =>
  mapSnap(
    await firestore()
      .collection(C.subjects)
      .where('courseId', '==', courseId)
      .where('yearId', '==', yearId)
      .orderBy('order', 'asc')
      .get()
  );

export const getSubsubjectsBySubject = async (courseId, yearId, subjectId) =>
  mapSnap(
    await firestore()
      .collection(C.subsubjects)
      .where('courseId', '==', courseId)
      .where('yearId', '==', yearId)
      .where('subjectId', '==', subjectId)
      .orderBy('order', 'asc')
      .get()
  );

export const getUnitsBySubsubject = async ({ courseId, yearId, subjectId, subsubjectId }) =>
  mapSnap(
    await firestore()
      .collection(C.units)
      .where('courseId', '==', courseId)
      .where('yearId', '==', yearId)
      .where('subjectId', '==', subjectId)
      .where('subsubjectId', '==', subsubjectId)
      .orderBy('order', 'asc')
      .get()
  );

export const getSubunitsByUnit = async ({ courseId, yearId, subjectId, subsubjectId, unitId }) =>
  mapSnap(
    await firestore()
      .collection(C.subunits)
      .where('courseId', '==', courseId)
      .where('yearId', '==', yearId)
      .where('subjectId', '==', subjectId)
      .where('subsubjectId', '==', subsubjectId)
      .where('unitId', '==', unitId)
      .orderBy('order', 'asc')
      .get()
  );

export const getVideosBySubunit = async ({
  courseId, yearId, subjectId, subsubjectId, unitId, subunitId,
}) =>
  mapSnap(
    await firestore()
      .collection(C.videos)
      .where('courseId', '==', courseId)
      .where('yearId', '==', yearId)
      .where('subjectId', '==', subjectId)
      .where('subsubjectId', '==', subsubjectId)
      .where('unitId', '==', unitId)
      .where('subunitId', '==', subunitId)
      .orderBy('order', 'asc')
      .get()
  );
