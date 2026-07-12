-- Migration: QR code attendance feature.
-- This is applied automatically at server start by ensureAttendanceSchema()
-- in backend/controllers/attendanceController.js, but is kept here too for
-- manual/CI migrations.
--
-- NOTE ON NAMING: the project already has an `attendance` table
-- (student_id, subject_id, date, status ENUM, marked_by) used throughout
-- the existing dashboards/reports for manual attendance. To avoid rebuilding
-- or breaking that table, QR-specific per-scan records are stored in a new
-- table, `attendance_qr_marks`, using the exact fields requested
-- (student_id, session_id, status, marked_time) plus the UNIQUE(student_id,
-- session_id) constraint. Every successful QR scan additionally upserts a
-- row into the existing `attendance` table so attendance percentages and
-- admin reports keep working unchanged.

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  faculty_id INT NOT NULL,
  class_label VARCHAR(100),          -- free-text "class / batch" label chosen by faculty
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
