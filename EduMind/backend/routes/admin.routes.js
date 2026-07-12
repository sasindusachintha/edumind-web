const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/dashboard', ctrl.getDashboardStats);

router.get('/students', ctrl.listStudents);
router.post('/students', ctrl.createStudent);
router.put('/students/:id', ctrl.updateStudent);
router.delete('/students/:id', ctrl.deleteStudent);

router.get('/faculty', ctrl.listFaculty);
router.post('/faculty', ctrl.createFaculty);
router.put('/faculty/:id', ctrl.updateFaculty);
router.delete('/faculty/:id', ctrl.deleteFaculty);

router.get('/branches', ctrl.listBranches);
router.post('/branches', ctrl.createBranch);
router.put('/branches/:id', ctrl.updateBranch);
router.delete('/branches/:id', ctrl.deleteBranch);

router.get('/subjects', ctrl.listSubjects);
router.post('/subjects', ctrl.createSubject);
router.put('/subjects/:id', ctrl.updateSubject);
router.delete('/subjects/:id', ctrl.deleteSubject);

router.get('/notices', ctrl.listNotices);
router.post('/notices', ctrl.createNotice);
router.delete('/notices/:id', ctrl.deleteNotice);

router.get('/exams', ctrl.listExams);
router.post('/exams', ctrl.createExam);
router.delete('/exams/:id', ctrl.deleteExam);

router.get('/logs', ctrl.listLogs);

router.put('/users/:id/status', ctrl.updateUserStatus);
router.get('/users', ctrl.listUsers);

router.get('/reports/attendance', ctrl.attendanceSummaryReport);
router.get('/reports/performance', ctrl.performanceReport);

module.exports = router;
