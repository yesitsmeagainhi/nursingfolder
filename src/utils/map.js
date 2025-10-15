// src/utils/map.js
export const THEME = '#2980b9';
export const BG = '#f4f7fb';

export const levels = [
  { key: 'course', label: 'Courses', fetch: 'getCourses' },
  { key: 'year', label: 'Years', fetch: 'getYearsByCourse' },
  { key: 'subject', label: 'Subjects', fetch: 'getSubjectsByYear' },
  { key: 'subsubject', label: 'Sub-subjects', fetch: 'getSubsubjectsBySubject' },
  { key: 'unit', label: 'Units', fetch: 'getUnitsBySubsubject' },
  { key: 'subunit', label: 'Subunits', fetch: 'getSubunitsByUnit' },
  { key: 'video', label: 'Videos', fetch: 'getVideosBySubunit' },
];
