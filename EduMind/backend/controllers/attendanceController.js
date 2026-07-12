const crypto = require('crypto');
const QRCode = require('qrcode');
const pool = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

/**
 * ================================================================
 * QR CODE ATTENDANCE
 * ================================================================
 * Faculty generates a temporary QR code linked to an attendance
 * session. Students authenticate and scan the QR code. The backend
 * validates the token, expiry time, and duplicate records before
 * storing attendance.
 *
 * This extends the existing manual attendance feature rather than
 * replacing it:
 *   - `attendance_sessions` is a new table describing each QR session.
 *   - `attendance_qr_marks` is a new table used purely to enforce
 *     "one scan per student per session" and to keep a QR-specific
 *     audit trail (id, student_id, session_id, status, marked_time).
 *   - The existing `attendance` table (student_id, subject_id, date,
 *     status, marked_by) is still the source of truth for attendance
 *     percentages/reports used elsewhere in the app, so every
 *     successful QR scan also upserts a row there — exactly the way
 *     a faculty member marking attendance manually already does.
 * ================================================================
 */

const DEFAULT_DURATION_MINUTES = 5;
const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 60;

/** Resolves the faculty.id row for the logged-in user (req.user.id) */
async function getFacultyId(userId) {
  const [rows] = await pool.query('SELECT id FROM faculty WHERE user_id = ?', [userId]);
  return rows[0]?.id;
}

/** Resolves the students.id row for the logged-in user (req.user.id) */
async function getStudentId(userId) {
  const [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
  return rows[0]?.id;
}

/**
 * Idempotent schema setup, mirroring `ensureAuthSchema()` in utils/otp.js.
 * Called once on server startup so the QR attendance feature works without
 * requiring a manual migration run.
 */
async function ensureAttendanceSchema() {
  await pool.query(`
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
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_qr_marks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      session_id INT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'present',
      marked_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_student_session (student_id, session_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE
    )
  `);
}

/** Lazily flips a session to 'expired' once its expiry time has passed. */
async function expireIfNeeded(session) {
  if (session.status === 'active' && new Date(session.expires_at) < new Date()) {
    await pool.query('UPDATE attendance_sessions SET status = ? WHERE id = ?', ['expired', session.id]);
    session.status = 'expired';
  }
  return session;
}

/**
 * Generates a QR code image (PNG data URL) for the given URL.
 * Exposed separately so it can be reused/tested independently of the route.
 */
async function generateQRCode(url) {
  return QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
}

/* ---------------------------------------------------------- */
/* POST /api/attendance/create-session (faculty only)           */
/* ---------------------------------------------------------- */
async function createAttendanceSession(req, res) {
  const { subjectId, classLabel, sessionDate, durationMinutes } = req.body;

  if (!subjectId || !sessionDate) {
    return res.status(400).json({ message: 'subjectId and sessionDate are required.' });
  }

  const duration = Math.min(
    MAX_DURATION_MINUTES,
    Math.max(MIN_DURATION_MINUTES, parseInt(durationMinutes, 10) || DEFAULT_DURATION_MINUTES)
  );

  try {
    const facultyId = await getFacultyId(req.user.id);
    if (!facultyId) return res.status(403).json({ message: 'Faculty profile not found.' });

    // Authorization: faculty can only generate sessions for subjects they teach.
    const [subjectRows] = await pool.query(
      'SELECT id, name, code FROM subjects WHERE id = ? AND faculty_id = ?',
      [subjectId, facultyId]
    );
    const subject = subjectRows[0];
    if (!subject) {
      return res.status(403).json({ message: 'You are not assigned to this subject.' });
    }

    const qrToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const [result] = await pool.query(
      `INSERT INTO attendance_sessions
        (subject_id, faculty_id, class_label, session_date, qr_token, duration_minutes, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [subjectId, facultyId, classLabel || null, sessionDate, qrToken, duration, expiresAt]
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const scanUrl = `${clientUrl}/attendance/scan/${qrToken}`;
    const qrImage = await generateQRCode(scanUrl);

    await logActivity(req.user.id, 'CREATE_ATTENDANCE_QR', `Generated attendance QR for subject #${subjectId} on ${sessionDate}`);

    res.status(201).json({
      sessionId: result.insertId,
      subjectName: subject.name,
      subjectCode: subject.code,
      qrToken,
      scanUrl,
      qrImage,
      expiresAt,
      durationMinutes: duration
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating the attendance session.' });
  }
}

/* ---------------------------------------------------------- */
/* GET /api/attendance/qr/:token (any authenticated user)       */
/* Lets the scan page show session info before/after marking.  */
/* ---------------------------------------------------------- */
async function verifyQRCode(req, res) {
  const { token } = req.params;
  if (!token) return res.status(400).json({ message: 'A QR token is required.' });

  try {
    const [rows] = await pool.query(
      `SELECT s.*, sub.name AS subjectName, sub.code AS subjectCode
       FROM attendance_sessions s JOIN subjects sub ON sub.id = s.subject_id
       WHERE s.qr_token = ?`,
      [token]
    );
    let session = rows[0];
    if (!session) return res.status(404).json({ message: 'This QR code is invalid or no longer exists.' });

    session = await expireIfNeeded(session);

    let alreadyMarked = false;
    if (req.user?.role === 'student') {
      const studentId = await getStudentId(req.user.id);
      if (studentId) {
        const [marks] = await pool.query(
          'SELECT id FROM attendance_qr_marks WHERE student_id = ? AND session_id = ?',
          [studentId, session.id]
        );
        alreadyMarked = Boolean(marks[0]);
      }
    }

    res.json({
      valid: session.status === 'active',
      status: session.status,
      subjectName: session.subjectName,
      subjectCode: session.subjectCode,
      classLabel: session.class_label,
      sessionDate: session.session_date,
      expiresAt: session.expires_at,
      alreadyMarked
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while validating the QR code.' });
  }
}

/* ---------------------------------------------------------- */
/* POST /api/attendance/mark (student only)                     */
/* ---------------------------------------------------------- */
async function markAttendance(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'A QR token is required.' });

  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return res.status(403).json({ message: 'Student profile not found.' });

    const [rows] = await pool.query(
      `SELECT s.*, sub.name AS subjectName, sub.code AS subjectCode
       FROM attendance_sessions s JOIN subjects sub ON sub.id = s.subject_id
       WHERE s.qr_token = ?`,
      [token]
    );
    let session = rows[0];
    if (!session) return res.status(404).json({ message: 'This QR code is invalid or no longer exists.' });

    session = await expireIfNeeded(session);
    if (session.status !== 'active') {
      return res.status(410).json({ message: 'This attendance QR code has expired.' });
    }

    // The student must actually be enrolled in the session's subject.
    const [enrolled] = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND subject_id = ?',
      [studentId, session.subject_id]
    );
    if (!enrolled[0]) {
      return res.status(403).json({ message: 'You are not enrolled in this subject.' });
    }

    // Duplicate prevention (UNIQUE(student_id, session_id) also enforces this at the DB level).
    const [existing] = await pool.query(
      'SELECT id FROM attendance_qr_marks WHERE student_id = ? AND session_id = ?',
      [studentId, session.id]
    );
    if (existing[0]) {
      return res.status(409).json({ message: 'You have already marked attendance for this session.' });
    }

    await pool.query(
      `INSERT INTO attendance_qr_marks (student_id, session_id, status) VALUES (?, ?, 'present')`,
      [studentId, session.id]
    );

    // Keep the existing attendance table (used by dashboards/reports) in sync.
    await pool.query(
      `INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
       VALUES (?, ?, ?, 'present', ?)
       ON DUPLICATE KEY UPDATE status = 'present', marked_by = VALUES(marked_by)`,
      [studentId, session.subject_id, session.session_date, session.faculty_id]
    );

    await logActivity(req.user.id, 'MARK_ATTENDANCE_QR', `Marked attendance via QR for subject #${session.subject_id}`);

    res.json({
      message: 'Attendance marked successfully.',
      subjectName: session.subjectName,
      subjectCode: session.subjectCode,
      markedAt: new Date().toISOString()
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already marked attendance for this session.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error while marking attendance.' });
  }
}

module.exports = {
  ensureAttendanceSchema,
  createAttendanceSession,
  generateQRCode,
  verifyQRCode,
  markAttendance
};
