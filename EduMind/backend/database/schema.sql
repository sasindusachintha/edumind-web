-- ============================================================
-- EduMind Smart College Management System
-- Database Schema (MySQL 8+)
-- Matches the ER Diagram / Class Diagram in the project proposal
-- ============================================================

DROP DATABASE IF EXISTS edumind;
CREATE DATABASE edumind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edumind;

-- ------------------------------------------------------------
-- USERS  (base "User" class -> Admin / Faculty / Student)
-- ------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,        -- bcrypt hash
  role ENUM('admin', 'faculty', 'student') NOT NULL,
  phone VARCHAR(20),
  avatar_color VARCHAR(7) DEFAULT '#3949AB',
  status TINYINT(1) NOT NULL DEFAULT 0, -- 0 = pending admin approval / disabled, 1 = approved & active
  is_verified TINYINT(1) NOT NULL DEFAULT 0, -- OTP-verified contact (email/phone)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- BRANCHES (academic departments)
-- ------------------------------------------------------------
CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- FACULTY (extends user)
-- ------------------------------------------------------------
CREATE TABLE faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  faculty_no VARCHAR(20) NOT NULL UNIQUE,
  designation VARCHAR(100) DEFAULT 'Lecturer',
  branch_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- SUBJECTS
-- ------------------------------------------------------------
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  credits INT DEFAULT 3,
  semester INT DEFAULT 1,
  branch_id INT,
  faculty_id INT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- STUDENTS (extends user)
-- ------------------------------------------------------------
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  student_no VARCHAR(20) NOT NULL UNIQUE,
  branch_id INT,
  semester INT DEFAULT 1,
  enrollment_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- ENROLLMENTS (student <-> subject, many-to-many)
-- ------------------------------------------------------------
CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  UNIQUE KEY uniq_enrollment (student_id, subject_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- ATTENDANCE
-- ------------------------------------------------------------
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'present',
  marked_by INT,                         -- faculty.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_attendance (student_id, subject_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES faculty(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- MARKS
-- ------------------------------------------------------------
CREATE TABLE marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  exam_type ENUM('internal', 'final') NOT NULL DEFAULT 'internal',
  internal_marks DECIMAL(5,2) DEFAULT 0,
  exam_marks DECIMAL(5,2) DEFAULT 0,
  semester INT DEFAULT 1,
  graded_by INT,                         -- faculty.id
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_marks (student_id, subject_id, exam_type),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES faculty(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- NOTICES
-- ------------------------------------------------------------
CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  audience ENUM('all', 'students', 'faculty') DEFAULT 'all',
  posted_by INT NOT NULL,                -- users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- EXAMS (schedule)
-- ------------------------------------------------------------
CREATE TABLE exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INT DEFAULT 120,
  venue VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- MATERIALS (lecture notes / assignments uploaded by faculty)
-- ------------------------------------------------------------
CREATE TABLE materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  faculty_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(255),
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- NOTES (personal notes, optionally shareable)
-- ------------------------------------------------------------
CREATE TABLE notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- ACTIVITY LOGS (system audit trail)
-- ------------------------------------------------------------
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(150) NOT NULL,
  details VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- NOTIFICATIONS (low attendance warnings, academic alerts)
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  type ENUM('info', 'warning', 'success') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX idx_attendance_subject_date ON attendance(subject_id, date);
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_notices_audience ON notices(audience);

CREATE TABLE IF NOT EXISTS user_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT DEFAULT 0,
  otp_type ENUM('email', 'sms') DEFAULT 'email',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_otps_email (email)
);

-- ------------------------------------------------------------
-- QR CODE ATTENDANCE (see database/migrations/20260711_qr_attendance_sessions.sql
-- for the full explanation of why this doesn't reuse the `attendance` table)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  faculty_id INT NOT NULL,
  class_label VARCHAR(100),
  session_date DATE NOT NULL,
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  duration_minutes INT NOT NULL DEFAULT 5,
  expires_at DATETIME NOT NULL,
  status ENUM('active', 'expired') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attendance_sessions_token (qr_token),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_qr_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  session_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'present',
  marked_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_student_session (student_id, session_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE
);
