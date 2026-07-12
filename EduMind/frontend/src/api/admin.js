import api from './axios';

export const getDashboard = () => api.get('/admin/dashboard');

export const listStudents = (params) => api.get('/admin/students', { params });
export const createStudent = (data) => api.post('/admin/students', data);
export const updateStudent = (id, data) => api.put(`/admin/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/admin/students/${id}`);

export const listFaculty = (params) => api.get('/admin/faculty', { params });
export const createFaculty = (data) => api.post('/admin/faculty', data);
export const updateFaculty = (id, data) => api.put(`/admin/faculty/${id}`, data);
export const deleteFaculty = (id) => api.delete(`/admin/faculty/${id}`);

export const listBranches = () => api.get('/admin/branches');
export const createBranch = (data) => api.post('/admin/branches', data);
export const updateBranch = (id, data) => api.put(`/admin/branches/${id}`, data);
export const deleteBranch = (id) => api.delete(`/admin/branches/${id}`);

export const listSubjects = () => api.get('/admin/subjects');
export const createSubject = (data) => api.post('/admin/subjects', data);
export const updateSubject = (id, data) => api.put(`/admin/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/admin/subjects/${id}`);

export const listNotices = () => api.get('/admin/notices');
export const createNotice = (data) => api.post('/admin/notices', data);
export const deleteNotice = (id) => api.delete(`/admin/notices/${id}`);

export const listExams = () => api.get('/admin/exams');
export const createExam = (data) => api.post('/admin/exams', data);
export const deleteExam = (id) => api.delete(`/admin/exams/${id}`);

export const listLogs = () => api.get('/admin/logs');

export const attendanceReport = () => api.get('/admin/reports/attendance');
export const performanceReport = () => api.get('/admin/reports/performance');

export const getUsers = (params) => api.get('/admin/users', { params }).then(r => r.data);
export const updateUserStatus = (id, status) => api.put(`/admin/users/${id}/status`, { status }).then(r => r.data);
