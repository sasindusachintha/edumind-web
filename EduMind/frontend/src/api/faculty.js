import api from './axios';

export const getProfile = () => api.get('/faculty/profile');
export const updateProfile = (data) => api.put('/faculty/profile', data);

export const getMySubjects = () => api.get('/faculty/subjects');
export const searchStudents = (params) => api.get('/faculty/students', { params });

export const getAttendanceSession = (subjectId, date) =>
  api.get('/faculty/attendance', { params: { subjectId, date } });
export const markAttendance = (subjectId, date, records) =>
  api.post('/faculty/attendance', { subjectId, date, records });

export const getMarksForSubject = (subjectId) => api.get('/faculty/marks', { params: { subjectId } });
export const saveMarks = (subjectId, records) => api.post('/faculty/marks', { subjectId, records });

export const listMaterials = () => api.get('/faculty/materials');
export const uploadMaterial = (formData) =>
  api.post('/faculty/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteMaterial = (id) => api.delete(`/faculty/materials/${id}`);

export const listNotes = () => api.get('/faculty/notes');
export const createNote = (data) => api.post('/faculty/notes', data);
export const updateNote = (id, data) => api.put(`/faculty/notes/${id}`, data);
export const deleteNote = (id) => api.delete(`/faculty/notes/${id}`);
