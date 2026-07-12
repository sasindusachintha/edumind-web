import api from './axios';

export const createAttendanceSession = (payload) => api.post('/attendance/create-session', payload);
export const verifyQrToken = (token) => api.get(`/attendance/qr/${token}`);
export const markAttendance = (token) => api.post('/attendance/mark', { token });
