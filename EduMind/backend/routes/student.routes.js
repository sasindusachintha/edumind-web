const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('student'));

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.get('/overview', ctrl.getOverview);
router.get('/schedule', ctrl.getSchedule);
router.get('/materials', ctrl.getMaterials);
router.get('/notices', ctrl.getNotices);
router.get('/attendance', ctrl.getAttendance);
router.get('/marks', ctrl.getMarks);

router.get('/notifications', ctrl.getNotifications);
router.put('/notifications/:id/read', ctrl.markNotificationRead);

router.get('/notes', ctrl.listNotes);
router.post('/notes', ctrl.createNote);
router.put('/notes/:id', ctrl.updateNote);
router.delete('/notes/:id', ctrl.deleteNote);

module.exports = router;
