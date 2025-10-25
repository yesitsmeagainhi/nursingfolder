// // src/services/firestore.js
// import firestore from '@react-native-firebase/firestore';

// // ---- Flat collections ----
// const C = {
//   courses: 'courses',
//   years: 'years',
//   subjects: 'subjects',
//   subsubjects: 'subsubjects',
//   units: 'units',
//   subunits: 'subunits',
//   videos: 'videos',
// };

// // Helpers
// const mapSnap = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// export const getCourses = async () =>
//   mapSnap(await firestore().collection(C.courses).orderBy('order', 'asc').get());

// export const getYearsByCourse = async (courseId) =>
//   mapSnap(
//     await firestore()
//       .collection(C.years)
//       .where('courseId', '==', courseId)
//       .orderBy('order', 'asc')
//       .get()
//   );

// export const getSubjectsByYear = async (courseId, yearId) =>
//   mapSnap(
//     await firestore()
//       .collection(C.subjects)
//       .where('courseId', '==', courseId)
//       .where('yearId', '==', yearId)
//       .orderBy('order', 'asc')
//       .get()
//   );

// export const getSubsubjectsBySubject = async (courseId, yearId, subjectId) =>
//   mapSnap(
//     await firestore()
//       .collection(C.subsubjects)
//       .where('courseId', '==', courseId)
//       .where('yearId', '==', yearId)
//       .where('subjectId', '==', subjectId)
//       .orderBy('order', 'asc')
//       .get()
//   );

// export const getUnitsBySubsubject = async ({ courseId, yearId, subjectId, subsubjectId }) =>
//   mapSnap(
//     await firestore()
//       .collection(C.units)
//       .where('courseId', '==', courseId)
//       .where('yearId', '==', yearId)
//       .where('subjectId', '==', subjectId)
//       .where('subsubjectId', '==', subsubjectId)
//       .orderBy('order', 'asc')
//       .get()
//   );

// export const getSubunitsByUnit = async ({ courseId, yearId, subjectId, subsubjectId, unitId }) =>
//   mapSnap(
//     await firestore()
//       .collection(C.subunits)
//       .where('courseId', '==', courseId)
//       .where('yearId', '==', yearId)
//       .where('subjectId', '==', subjectId)
//       .where('subsubjectId', '==', subsubjectId)
//       .where('unitId', '==', unitId)
//       .orderBy('order', 'asc')
//       .get()
//   );

// export const getVideosBySubunit = async ({
//   courseId, yearId, subjectId, subsubjectId, unitId, subunitId,
// }) =>
//   mapSnap(
//     await firestore()
//       .collection(C.videos)
//       .where('courseId', '==', courseId)
//       .where('yearId', '==', yearId)
//       .where('subjectId', '==', subjectId)
//       .where('subsubjectId', '==', subsubjectId)
//       .where('unitId', '==', unitId)
//       .where('subunitId', '==', subunitId)
//       .orderBy('order', 'asc')
//       .get()
//   );
// export const searchNodesByNamePrefix = async (query, limit = 50) => {
//   const lower = (query || '').trim().toLowerCase();
//   if (!lower) return [];

//   const snap = await firestore()
//     .collection('nodes')
//     .where('name_lowercase', '>=', lower)
//     .where('name_lowercase', '<=', lower + '\uf8ff')
//     .limit(limit)
//     .get();

//   return snap.docs.map(d => ({
//     id: d.id,
//     __collection: 'nodes',
//     ...d.data(),
//   }));
// };

// /**
//  * Optional: fetch top-level folders (parentId == null, type == 'folder')
//  * to show on the Home hero + "popular". No search here—just initial load.
//  */
// export const getTopLevelFolders = async (limit = 100) => {
//   const snap = await firestore()
//     .collection('nodes')
//     .where('parentId', '==', null)
//     .where('type', '==', 'folder')
//     .orderBy('order', 'asc') // needs a composite index with (parentId, type, order)
//     .limit(limit)
//     .get();

//   return snap.docs.map(d => ({
//     id: d.id,
//     __collection: 'nodes',
//     ...d.data(),
//   }));
// };


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

const mapSnap = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// =========================
// NODES (folder/file model)
// =========================
const NODES = firestore().collection('nodes');

/**
 * List children for a given parent (folders first, then files)
 * @param {string|null} parentId - if null → root
 * @param {number} limit - optional hard limit (applied to each query)
 */
export const listChildren = async (parentId = null, limit = 200) => {
  const pid = parentId ?? null;

  // Folders
  const folderSnap = await NODES
    .where('parentId', '==', pid)
    .where('type', '==', 'folder')
    .orderBy('order', 'asc') // composite index: parentId+type+order
    .limit(limit)
    .get();

  // Files / topics
  const fileSnap = await NODES
    .where('parentId', '==', pid)
    .where('type', '==', 'file')
    .orderBy('order', 'asc') // composite index: parentId+type+order
    .limit(limit)
    .get();

  return {
    folders: folderSnap.docs.map((d) => ({ id: d.id, __collection: 'nodes', ...d.data() })),
    files: fileSnap.docs.map((d) => ({ id: d.id, __collection: 'nodes', ...d.data() })),
  };
};

/** Fetch a single node (useful for breadcrumbs, viewers, etc.) */
export const getNodeById = async (id) => {
  const doc = await NODES.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, __collection: 'nodes', ...doc.data() };
};

/**
 * Build breadcrumbs by walking parentId chain (client-side)
 * stops after 15 hops as a safety cap
 */
export const buildBreadcrumbs = async (leafId) => {
  const chain = [];
  let currentId = leafId;
  let hops = 0;

  while (currentId && hops < 15) {
    const n = await getNodeById(currentId);
    if (!n) break;
    chain.push({ id: n.id, name: n.name });
    currentId = n.parentId ?? null;
    hops++;
  }
  // root at the end → reverse to make root → ... → leaf
  return chain.reverse();
};

// =========================
// SEARCH (already present)
// =========================
export const searchNodesByNamePrefix = async (query, limit = 50) => {
  const lower = (query || '').trim().toLowerCase();
  if (!lower) return [];

  const snap = await NODES
    .where('name_lowercase', '>=', lower)
    .where('name_lowercase', '<=', lower + '\uf8ff')
    .limit(limit)
    .get();

  return snap.docs.map(d => ({
    id: d.id,
    __collection: 'nodes',
    ...d.data(),
  }));
};

/**
 * Optional: fetch top-level folders (parentId == null, type == 'folder')
 * to show on the Home hero + "popular"
 */
export const getTopLevelFolders = async (limit = 100) => {
  const snap = await NODES
    .where('parentId', '==', null)
    .where('type', '==', 'folder')
    .orderBy('order', 'asc') // composite index: parentId+type+order
    .limit(limit)
    .get();

  return snap.docs.map(d => ({
    id: d.id,
    __collection: 'nodes',
    ...d.data(),
  }));
};

// ===== Existing flat APIs (unchanged) =====
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

export const getVideosBySubunit = async ({ courseId, yearId, subjectId, subsubjectId, unitId, subunitId }) =>
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
