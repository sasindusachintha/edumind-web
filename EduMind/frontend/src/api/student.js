import api from './axios';

export const getProfile = () => api.get('/student/profile');
export const updateProfile = (data) => api.put('/student/profile', data);
export const getOverview = () => api.get('/student/overview');
export const getSchedule = () => api.get('/student/schedule');
export const getMaterials = () => api.get('/student/materials');
export const getNotices = () => api.get('/student/notices');
export const getAttendance = () => api.get('/student/attendance');
export const getMarks = () => api.get('/student/marks');

export const getNotifications = () => api.get('/student/notifications');
export const markNotificationRead = (id) => api.put(`/student/notifications/${id}/read`);

export const listNotes = () => api.get('/student/notes');
export const createNote = (data) => api.post('/student/notes', data);
export const updateNote = (id, data) => api.put(`/student/notes/${id}`, data);
export const deleteNote = (id) => api.delete(`/student/notes/${id}`);
