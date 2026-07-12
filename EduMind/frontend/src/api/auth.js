import api from './axios';

export const login = (email, password, captchaToken) => api.post('/auth/login', { email, password, captchaToken });
export const register = (payload) => api.post('/auth/register', payload);
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload);
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload);
export const verifyResetOtp = (payload) => api.post('/auth/verify-reset-otp', payload);
export const resetPassword = (payload) => api.post('/auth/reset-password', payload);
export const getMe = () => api.get('/auth/me');
export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/change-password', { currentPassword, newPassword });
