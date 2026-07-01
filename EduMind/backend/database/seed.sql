-- ============================================================
-- EduMind Smart College Management System
-- Seed data for local demo / development
-- Demo credentials:
--   Admin    : admin@edumind.lk     / Admin@123
--   Faculty  : rahul.s@edumind.lk   / Faculty@123  (and other faculty below)
--   Student  : amit.s@edumind.lk    / Student@123  (and other students below)
-- ============================================================
USE edumind;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE notes;
TRUNCATE TABLE materials;
TRUNCATE TABLE exams;
TRUNCATE TABLE notices;
TRUNCATE TABLE marks;
TRUNCATE TABLE attendance;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE students;
TRUNCATE TABLE subjects;
TRUNCATE TABLE faculty;
TRUNCATE TABLE branches;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;


-- USERS

INSERT INTO users (id, name, email, password, role, phone, avatar_color) VALUES
(1, 'Sasindu Sachintha', 'admin@edumind.lk', '$2b$10$RgJgUibX8dRHtsupexZMDeMYOdJg8tkAjb9YrPKaq2QOX6z0A/VTK', 'admin', '0771234567', '#3949AB'),
(2, 'Dr. Rahul Senanayake', 'rahul.s@edumind.lk', '$2b$10$Pg605gD8O7HCi9zEyJDd9uzSdmubdw3PZ.rlnWmSIEfdnihNAJzKK', 'faculty', '0772223344', '#00897B'),
(3, 'Anjali Perera', 'anjali.p@edumind.lk', '$2b$10$Pg605gD8O7HCi9zEyJDd9uzSdmubdw3PZ.rlnWmSIEfdnihNAJzKK', 'faculty', '0772223345', '#00897B'),
(4, 'Kasun Fernando', 'kasun.f@edumind.lk', '$2b$10$Pg605gD8O7HCi9zEyJDd9uzSdmubdw3PZ.rlnWmSIEfdnihNAJzKK', 'faculty', '0772223346', '#00897B'),
(5, 'Amit Sharma', 'amit.s@edumind.lk', '$2b$10$37IZtkoz./SCJR999YOIN.8r80qymGS4KqLJgt3MVTrrCNe/IV1fm', 'student', '0719991111', '#F0A500'),
(6, 'Nadeesha Silva', 'nadeesha.s@edumind.lk', '$2b$10$37IZtkoz./SCJR999YOIN.8r80qymGS4KqLJgt3MVTrrCNe/IV1fm', 'student', '0719991112', '#F0A500'),
(7, 'Tharindu Jay', 'tharindu.j@edumind.lk', '$2b$10$37IZtkoz./SCJR999YOIN.8r80qymGS4KqLJgt3MVTrrCNe/IV1fm', 'student', '0719991113', '#F0A500'),
(8, 'Kavindi Madushani', 'kavindi.m@edumind.lk', '$2b$10$37IZtkoz./SCJR999YOIN.8r80qymGS4KqLJgt3MVTrrCNe/IV1fm', 'student', '0719991114', '#F0A500'),
(9, 'Ruwan Bandara', 'ruwan.b@edumind.lk', '$2b$10$37IZtkoz./SCJR999YOIN.8r80qymGS4KqLJgt3MVTrrCNe/IV1fm', 'student', '0719991115', '#F0A500'),
(10, 'Sajini Perera', 'sajini.p@edumind.lk', '$2b$10$37IZtkoz./SCJR999YOIN.8r80qymGS4KqLJgt3MVTrrCNe/IV1fm', 'student', '0719991116', '#F0A500'),
(11, 'Dilshan Kumara', 'dilshan.k@edumind.lk', '$2b$10$37IZtkoz./SCJR999YOIN.8r80qymGS4KqLJgt3MVTrrCNe/IV1fm', 'student', '0719991117', '#F0A500'),
(12, 'Hashini De Silva', 'hashini.d@edumind.lk', '$2b$10$37IZtkoz./SCJR999YOIN.8r80qymGS4KqLJgt3MVTrrCNe/IV1fm', 'student', '0719991118', '#F0A500');


-- BRANCHES

INSERT INTO branches (id, name, code, description) VALUES
(1, 'Computer Science & Engineering', 'CSE', 'Software, systems and computing disciplines'),
(2, 'Business Management', 'BM', 'Business administration and management studies');


-- FACULTY

INSERT INTO faculty (id, user_id, faculty_no, designation, branch_id) VALUES
(1, 2, 'F001', 'Senior Lecturer', 1),
(2, 3, 'F002', 'Lecturer', 1),
(3, 4, 'F003', 'Lecturer', 2);


-- SUBJECTS

INSERT INTO subjects (id, name, code, credits, semester, branch_id, faculty_id) VALUES
(1, 'Database Management Systems', 'CS201', 4, 3, 1, 1),
(2, 'Operating Systems', 'CS202', 4, 3, 1, 1),
(3, 'Web Application Development', 'CS203', 3, 3, 1, 2),
(4, 'Data Structures & Algorithms', 'CS204', 4, 3, 1, 2),
(5, 'Marketing Principles', 'BM101', 3, 3, 2, 3),
(6, 'Financial Accounting', 'BM102', 3, 3, 2, 3);


-- STUDENTS

INSERT INTO students (id, user_id, student_no, branch_id, semester, enrollment_date) VALUES
(1, 5, 'ST001', 1, 3, '2024-01-15'),
(2, 6, 'ST002', 1, 3, '2024-01-15'),
(3, 7, 'ST003', 1, 3, '2024-01-15'),
(4, 8, 'ST004', 1, 3, '2024-01-15'),
(5, 9, 'ST005', 1, 3, '2024-01-15'),
(6, 10, 'ST006', 1, 3, '2024-01-15'),
(7, 11, 'ST007', 2, 3, '2024-01-15'),
(8, 12, 'ST008', 2, 3, '2024-01-15');


-- ENROLLMENTS

INSERT INTO enrollments (id, student_id, subject_id) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 1, 4),
(5, 2, 1),
(6, 2, 2),
(7, 2, 3),
(8, 2, 4),
(9, 3, 1),
(10, 3, 2),
(11, 3, 3),
(12, 3, 4),
(13, 4, 1),
(14, 4, 2),
(15, 4, 3),
(16, 4, 4),
(17, 5, 1),
(18, 5, 2),
(19, 5, 3),
(20, 5, 4),
(21, 6, 1),
(22, 6, 2),
(23, 6, 3),
(24, 6, 4),
(25, 7, 5),
(26, 7, 6),
(27, 8, 5),
(28, 8, 6);

-- ATTENDANCE

INSERT INTO attendance (id, student_id, subject_id, date, status, marked_by) VALUES
(1, 1, 1, '2026-06-08', 'present', 1),
(2, 1, 1, '2026-06-09', 'present', 1),
(3, 1, 1, '2026-06-10', 'present', 1),
(4, 1, 1, '2026-06-11', 'present', 1),
(5, 1, 1, '2026-06-12', 'present', 1),
(6, 1, 1, '2026-06-15', 'present', 1),
(7, 1, 1, '2026-06-16', 'present', 1),
(8, 1, 1, '2026-06-17', 'present', 1),
(9, 2, 1, '2026-06-08', 'present', 1),
(10, 2, 1, '2026-06-09', 'present', 1),
(11, 2, 1, '2026-06-10', 'absent', 1),
(12, 2, 1, '2026-06-11', 'present', 1),
(13, 2, 1, '2026-06-12', 'present', 1),
(14, 2, 1, '2026-06-15', 'present', 1),
(15, 2, 1, '2026-06-16', 'present', 1),
(16, 2, 1, '2026-06-17', 'present', 1),
(17, 3, 1, '2026-06-08', 'present', 1),
(18, 3, 1, '2026-06-09', 'absent', 1),
(19, 3, 1, '2026-06-10', 'present', 1),
(20, 3, 1, '2026-06-11', 'present', 1),
(21, 3, 1, '2026-06-12', 'absent', 1),
(22, 3, 1, '2026-06-15', 'present', 1),
(23, 3, 1, '2026-06-16', 'present', 1),
(24, 3, 1, '2026-06-17', 'present', 1),
(25, 4, 1, '2026-06-08', 'present', 1),
(26, 4, 1, '2026-06-09', 'present', 1),
(27, 4, 1, '2026-06-10', 'present', 1),
(28, 4, 1, '2026-06-11', 'late', 1),
(29, 4, 1, '2026-06-12', 'present', 1),
(30, 4, 1, '2026-06-15', 'present', 1),
(31, 4, 1, '2026-06-16', 'present', 1),
(32, 4, 1, '2026-06-17', 'present', 1),
(33, 5, 1, '2026-06-08', 'absent', 1),
(34, 5, 1, '2026-06-09', 'absent', 1),
(35, 5, 1, '2026-06-10', 'present', 1),
(36, 5, 1, '2026-06-11', 'absent', 1),
(37, 5, 1, '2026-06-12', 'present', 1),
(38, 5, 1, '2026-06-15', 'absent', 1),
(39, 5, 1, '2026-06-16', 'present', 1),
(40, 5, 1, '2026-06-17', 'absent', 1),
(41, 6, 1, '2026-06-08', 'present', 1),
(42, 6, 1, '2026-06-09', 'present', 1),
(43, 6, 1, '2026-06-10', 'present', 1),
(44, 6, 1, '2026-06-11', 'present', 1),
(45, 6, 1, '2026-06-12', 'absent', 1),
(46, 6, 1, '2026-06-15', 'present', 1),
(47, 6, 1, '2026-06-16', 'present', 1),
(48, 6, 1, '2026-06-17', 'present', 1),
(49, 1, 2, '2026-06-08', 'present', 1),
(50, 1, 2, '2026-06-09', 'present', 1),
(51, 1, 2, '2026-06-10', 'present', 1),
(52, 1, 2, '2026-06-11', 'present', 1),
(53, 1, 2, '2026-06-12', 'present', 1),
(54, 1, 2, '2026-06-15', 'present', 1),
(55, 1, 2, '2026-06-16', 'present', 1),
(56, 1, 2, '2026-06-17', 'present', 1),
(57, 2, 2, '2026-06-08', 'present', 1),
(58, 2, 2, '2026-06-09', 'present', 1),
(59, 2, 2, '2026-06-10', 'absent', 1),
(60, 2, 2, '2026-06-11', 'present', 1),
(61, 2, 2, '2026-06-12', 'present', 1),
(62, 2, 2, '2026-06-15', 'present', 1),
(63, 2, 2, '2026-06-16', 'present', 1),
(64, 2, 2, '2026-06-17', 'present', 1),
(65, 3, 2, '2026-06-08', 'present', 1),
(66, 3, 2, '2026-06-09', 'absent', 1),
(67, 3, 2, '2026-06-10', 'present', 1),
(68, 3, 2, '2026-06-11', 'present', 1),
(69, 3, 2, '2026-06-12', 'absent', 1),
(70, 3, 2, '2026-06-15', 'present', 1),
(71, 3, 2, '2026-06-16', 'present', 1),
(72, 3, 2, '2026-06-17', 'present', 1),
(73, 4, 2, '2026-06-08', 'present', 1),
(74, 4, 2, '2026-06-09', 'present', 1),
(75, 4, 2, '2026-06-10', 'present', 1),
(76, 4, 2, '2026-06-11', 'late', 1),
(77, 4, 2, '2026-06-12', 'present', 1),
(78, 4, 2, '2026-06-15', 'present', 1),
(79, 4, 2, '2026-06-16', 'present', 1),
(80, 4, 2, '2026-06-17', 'present', 1),
(81, 5, 2, '2026-06-08', 'absent', 1),
(82, 5, 2, '2026-06-09', 'absent', 1),
(83, 5, 2, '2026-06-10', 'present', 1),
(84, 5, 2, '2026-06-11', 'absent', 1),
(85, 5, 2, '2026-06-12', 'present', 1),
(86, 5, 2, '2026-06-15', 'absent', 1),
(87, 5, 2, '2026-06-16', 'present', 1),
(88, 5, 2, '2026-06-17', 'absent', 1),
(89, 6, 2, '2026-06-08', 'present', 1),
(90, 6, 2, '2026-06-09', 'present', 1),
(91, 6, 2, '2026-06-10', 'present', 1),
(92, 6, 2, '2026-06-11', 'present', 1),
(93, 6, 2, '2026-06-12', 'absent', 1),
(94, 6, 2, '2026-06-15', 'present', 1),
(95, 6, 2, '2026-06-16', 'present', 1),
(96, 6, 2, '2026-06-17', 'present', 1),
(97, 7, 5, '2026-06-08', 'present', 3),
(98, 7, 5, '2026-06-09', 'present', 3),
(99, 7, 5, '2026-06-10', 'present', 3),
(100, 7, 5, '2026-06-11', 'present', 3),
(101, 7, 5, '2026-06-12', 'present', 3),
(102, 7, 5, '2026-06-15', 'present', 3),
(103, 7, 5, '2026-06-16', 'present', 3),
(104, 7, 5, '2026-06-17', 'present', 3),
(105, 8, 5, '2026-06-08', 'present', 3),
(106, 8, 5, '2026-06-09', 'present', 3),
(107, 8, 5, '2026-06-10', 'present', 3),
(108, 8, 5, '2026-06-11', 'absent', 3),
(109, 8, 5, '2026-06-12', 'present', 3),
(110, 8, 5, '2026-06-15', 'present', 3),
(111, 8, 5, '2026-06-16', 'present', 3),
(112, 8, 5, '2026-06-17', 'present', 3);

-- MARKS

INSERT INTO marks (id, student_id, subject_id, exam_type, internal_marks, exam_marks, semester, graded_by) VALUES
(1, 1, 1, 'internal', 42, 0, 3, 1),
(2, 1, 1, 'final', 0, 48, 3, 1),
(3, 2, 1, 'internal', 38, 0, 3, 1),
(4, 2, 1, 'final', 0, 44, 3, 1),
(5, 3, 1, 'internal', 30, 0, 3, 1),
(6, 3, 1, 'final', 0, 35, 3, 1),
(7, 4, 1, 'internal', 45, 0, 3, 1),
(8, 4, 1, 'final', 0, 50, 3, 1),
(9, 5, 1, 'internal', 22, 0, 3, 1),
(10, 5, 1, 'final', 0, 28, 3, 1),
(11, 6, 1, 'internal', 36, 0, 3, 1),
(12, 6, 1, 'final', 0, 40, 3, 1),
(13, 1, 2, 'internal', 43, 0, 3, 1),
(14, 1, 2, 'final', 0, 49, 3, 1),
(15, 2, 2, 'internal', 39, 0, 3, 1),
(16, 2, 2, 'final', 0, 45, 3, 1),
(17, 3, 2, 'internal', 31, 0, 3, 1),
(18, 3, 2, 'final', 0, 36, 3, 1),
(19, 4, 2, 'internal', 46, 0, 3, 1),
(20, 4, 2, 'final', 0, 50, 3, 1),
(21, 5, 2, 'internal', 23, 0, 3, 1),
(22, 5, 2, 'final', 0, 29, 3, 1),
(23, 6, 2, 'internal', 37, 0, 3, 1),
(24, 6, 2, 'final', 0, 41, 3, 1),
(25, 1, 3, 'internal', 41, 0, 3, 1),
(26, 1, 3, 'final', 0, 47, 3, 1),
(27, 2, 3, 'internal', 37, 0, 3, 1),
(28, 2, 3, 'final', 0, 43, 3, 1),
(29, 3, 3, 'internal', 29, 0, 3, 1),
(30, 3, 3, 'final', 0, 34, 3, 1),
(31, 4, 3, 'internal', 44, 0, 3, 1),
(32, 4, 3, 'final', 0, 49, 3, 1),
(33, 5, 3, 'internal', 21, 0, 3, 1),
(34, 5, 3, 'final', 0, 27, 3, 1),
(35, 6, 3, 'internal', 35, 0, 3, 1),
(36, 6, 3, 'final', 0, 39, 3, 1),
(37, 1, 4, 'internal', 42, 0, 3, 1),
(38, 1, 4, 'final', 0, 48, 3, 1),
(39, 2, 4, 'internal', 38, 0, 3, 1),
(40, 2, 4, 'final', 0, 44, 3, 1),
(41, 3, 4, 'internal', 30, 0, 3, 1),
(42, 3, 4, 'final', 0, 35, 3, 1),
(43, 4, 4, 'internal', 45, 0, 3, 1),
(44, 4, 4, 'final', 0, 50, 3, 1),
(45, 5, 4, 'internal', 22, 0, 3, 1),
(46, 5, 4, 'final', 0, 28, 3, 1),
(47, 6, 4, 'internal', 36, 0, 3, 1),
(48, 6, 4, 'final', 0, 40, 3, 1),
(49, 7, 5, 'internal', 35, 0, 3, 3),
(50, 7, 5, 'final', 0, 41, 3, 3),
(51, 7, 6, 'internal', 35, 0, 3, 3),
(52, 7, 6, 'final', 0, 41, 3, 3),
(53, 8, 5, 'internal', 35, 0, 3, 3),
(54, 8, 5, 'final', 0, 41, 3, 3),
(55, 8, 6, 'internal', 35, 0, 3, 3),
(56, 8, 6, 'final', 0, 41, 3, 3);

-- NOTICES

INSERT INTO notices (id, title, content, audience, posted_by, created_at) VALUES
(1, 'Mid-Semester Examination Timetable Released', 'The mid-semester examination timetable for all branches has been published. Please check the Exams section for your subject schedule.', 'all', 1, '2026-06-10 09:00:00'),
(2, 'Library Extended Hours During Exam Week', 'The campus library will remain open until 10 PM from June 15th to June 22nd to support exam preparation.', 'students', 1, '2026-06-11 10:30:00'),
(3, 'Faculty Meeting - Curriculum Review', 'All faculty members are requested to attend the curriculum review meeting on June 20th at 2 PM in the conference hall.', 'faculty', 1, '2026-06-12 14:00:00'),
(4, 'Assignment 02 Deadline Extended', 'The deadline for Database Management Systems Assignment 02 has been extended to June 25th.', 'students', 2, '2026-06-14 11:15:00');


-- EXAMS

INSERT INTO exams (id, subject_id, exam_date, start_time, duration_minutes, venue) VALUES
(1, 1, '2026-07-02', '09:00:00', 120, 'Hall A'),
(2, 2, '2026-07-04', '09:00:00', 120, 'Hall A'),
(3, 3, '2026-07-06', '13:00:00', 90, 'Lab 2'),
(4, 4, '2026-07-08', '09:00:00', 120, 'Hall B'),
(5, 5, '2026-07-03', '09:00:00', 120, 'Hall C'),
(6, 6, '2026-07-05', '09:00:00', 120, 'Hall C');


-- MATERIALS

INSERT INTO materials (id, subject_id, faculty_id, title, description, file_path, file_name, uploaded_at) VALUES
(1, 1, 1, 'DBMS - Normalization Slides', 'Lecture slides covering 1NF, 2NF, 3NF and BCNF with worked examples.', 'materials/sample-normalization.pdf', 'DBMS_Normalization.pdf', '2026-06-05 10:00:00'),
(2, 1, 1, 'Assignment 02 - ER Modelling', 'Design an ER diagram for a hospital management system.', 'materials/sample-assignment-2.pdf', 'Assignment_02_ER_Modelling.pdf', '2026-06-12 16:00:00'),
(3, 3, 2, 'Web Dev - React Fundamentals', 'Introductory slide deck on components, props and state.', 'materials/sample-react-intro.pdf', 'React_Fundamentals.pdf', '2026-06-08 09:30:00');


-- NOTES

INSERT INTO notes (id, user_id, title, content, is_shared) VALUES
(1, 5, 'DBMS revision points', 'Review normalization forms before the mid-exam. Focus on BCNF edge cases.', FALSE),
(2, 2, 'Lecture pacing notes', 'Slow down on transaction isolation levels next semester - students struggled this batch.', FALSE),
(3, 5, 'Group project ideas', 'Possible final-year project: attendance analytics dashboard using historical data.', TRUE);


-- ACTIVITY LOGS

INSERT INTO activity_logs (id, user_id, action, details, created_at) VALUES
(1, 1, 'LOGIN', 'Admin logged in', '2026-06-15 08:02:00'),
(2, 1, 'CREATE_STUDENT', 'Added student ST008 - Hashini De Silva', '2026-06-15 08:15:00'),
(3, 2, 'MARK_ATTENDANCE', 'Marked attendance for CS201 on 2026-06-16', '2026-06-16 09:05:00'),
(4, 1, 'PUBLISH_NOTICE', 'Published notice: Mid-Semester Examination Timetable Released', '2026-06-10 09:00:00'),
(5, 3, 'UPLOAD_MATERIAL', 'Uploaded React Fundamentals slides for CS203', '2026-06-08 09:30:00'),
(6, 1, 'DELETE_FACULTY', 'Attempted removal of inactive faculty record (cancelled)', '2026-06-13 12:00:00');


-- NOTIFICATIONS

INSERT INTO notifications (id, user_id, message, type, is_read) VALUES
(1, 9, 'Your attendance in Database Management Systems has dropped below 75%.', 'warning', FALSE),
(2, 9, 'Your attendance in Operating Systems has dropped below 75%.', 'warning', FALSE),
(3, 5, 'New material uploaded for Database Management Systems.', 'info', TRUE),
(4, 6, 'Assignment 02 deadline extended to June 25th.', 'info', FALSE),
(5, 2, 'You have 6 students enrolled in CS201 awaiting final marks entry.', 'info', FALSE);

