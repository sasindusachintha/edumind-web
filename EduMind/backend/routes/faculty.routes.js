const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/facultyController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verifyToken, requireRole('faculty'));

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);

router.get('/subjects', ctrl.getMySubjects);
router.get('/students', ctrl.searchStudents);

router.get('/attendance', ctrl.getAttendanceForSession);
router.post('/attendance', ctrl.markAttendance);

router.get('/marks', ctrl.getMarksForSubject);
router.post('/marks', ctrl.saveMarks);

router.get('/materials', ctrl.listMaterials);
router.post('/materials', upload.single('file'), ctrl.uploadMaterial);
router.delete('/materials/:id', ctrl.deleteMaterial);

router.get('/notes', ctrl.listNotes);
router.post('/notes', ctrl.createNote);
router.put('/notes/:id', ctrl.updateNote);
router.delete('/notes/:id', ctrl.deleteNote);

module.exports = router;
