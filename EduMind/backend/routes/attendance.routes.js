const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Faculty creates a temporary QR-linked attendance session.
router.post('/create-session', verifyToken, requireRole('faculty'), ctrl.createAttendanceSession);

// Any authenticated user can check a QR token's validity (used by the scan page).
router.get('/qr/:token', verifyToken, ctrl.verifyQRCode);

// Only logged-in students can mark their own attendance.
router.post('/mark', verifyToken, requireRole('student'), ctrl.markAttendance);

module.exports = router;
