const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  changePassword,
  register,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { verifyRecaptcha } = require('../middleware/recaptcha');

router.post('/login', verifyRecaptcha, login);
router.post('/register', verifyRecaptcha, register);
// OTP verification only requires email + OTP — no CAPTCHA here.
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', verifyRecaptcha, forgotPassword);
router.post('/verify-reset-otp', verifyRecaptcha, verifyResetOtp);
router.post('/reset-password', verifyRecaptcha, resetPassword);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
