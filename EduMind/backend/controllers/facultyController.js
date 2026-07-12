const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { logActivity } = require('../utils/activityLogger');

// How many days in the past a faculty member is allowed to create/edit
// attendance for. Older dates become view-only (via getAttendanceReport).
// Configurable via .env; defaults to 30 days if not set.
const ATTENDANCE_EDIT_WINDOW_DAYS = parseInt(process.env.ATTENDANCE_EDIT_WINDOW_DAYS, 10) || 30;

/** True if `dateStr` (YYYY-MM-DD) is still within the editable window. */
function isWithinEditWindow(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - ATTENDANCE_EDIT_WINDOW_DAYS);
  return target >= cutoff;
}

/** Resolves the faculty.id row for the logged-in user (req.user.id) */
async function getFacultyId(userId) {
  const [rows] = await pool.query('SELECT id FROM faculty WHERE user_id = ?', [userId]);
  return rows[0]?.id;
}

/* ---------------------------------------------------------- */
/* PROFILE                                                       */
/* ---------------------------------------------------------- */
async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT f.id AS facultyId, f.faculty_no, f.designation, u.name, u.email, u.phone, u.avatar_color,
              b.id AS branchId, b.name AS branchName
       FROM faculty f JOIN users u ON u.id = f.user_id LEFT JOIN branches b ON b.id = f.branch_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Faculty profile not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
}

async function updateProfile(req, res) {
  const { name, phone } = req.body;
  try {
    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, req.user.id]);
    await logActivity(req.user.id, 'UPDATE_PROFILE', 'Faculty updated their profile');
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
}

/* ---------------------------------------------------------- */
/* MY SUBJECTS                                                   */
/* ---------------------------------------------------------- */
async function getMySubjects(req, res) {
  try {
    const facultyId = await getFacultyId(req.user.id);
    const [rows] = await pool.query(
      `SELECT s.*, b.name AS branchName,
              (SELECT COUNT(*) FROM enrollments e WHERE e.subject_id = s.id) AS studentCount
       FROM subjects s LEFT JOIN branches b ON b.id = s.branch_id
       WHERE s.faculty_id = ? ORDER BY s.name`,
      [facultyId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching subjects.' });
  }
}

/* ---------------------------------------------------------- */
/* STUDENTS (search across own subjects)                        */
/* ---------------------------------------------------------- */
async function searchStudents(req, res) {
  try {
    const facultyId = await getFacultyId(req.user.id);
    const { search = '', subjectId = '' } = req.query;

    let sql = `
      SELECT DISTINCT st.id, st.student_no, st.semester, u.name, u.email, b.name AS branchName
      FROM students st
      JOIN users u ON u.id = st.user_id
      LEFT JOIN branches b ON b.id = st.branch_id
      JOIN enrollments en ON en.student_id = st.id
      JOIN subjects sub ON sub.id = en.subject_id
      WHERE sub.faculty_id = ? AND (u.name LIKE ? OR st.student_no LIKE ?)
    `;
    const params = [facultyId, `%${search}%`, `%${search}%`];
    if (subjectId) {
      sql += ' AND sub.id = ?';
      params.push(subjectId);
    }
    sql += ' ORDER BY st.student_no';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while searching students.' });
  }
}

/* ---------------------------------------------------------- */
/* ATTENDANCE                                                     */
/* ---------------------------------------------------------- */
async function getAttendanceForSession(req, res) {
  const { subjectId, date } = req.query;
  if (!subjectId || !date) return res.status(400).json({ message: 'subjectId and date are required.' });
  try {
    const [students] = await pool.query(
      `SELECT st.id AS studentId, st.student_no, u.name,
              a.status, a.id AS attendanceId
       FROM enrollments en
       JOIN students st ON st.id = en.student_id
       JOIN users u ON u.id = st.user_id
       LEFT JOIN attendance a ON a.student_id = st.id AND a.subject_id = en.subject_id AND a.date = ?
       WHERE en.subject_id = ?
       ORDER BY st.student_no`,
      [date, subjectId]
    );
    res.json({
      students,
      editable: isWithinEditWindow(date),
      editWindowDays: ATTENDANCE_EDIT_WINDOW_DAYS
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while loading attendance session.' });
  }
}

/**
 * Read-only attendance history/report. Never allows editing — this is what
 * the "view past attendance" page uses instead of the manual mark form.
 * GET /api/faculty/attendance/report?subjectId=&from=&to=
 */
async function getAttendanceReport(req, res) {
  const { subjectId, from, to } = req.query;
  if (!subjectId || !from || !to) {
    return res.status(400).json({ message: 'subjectId, from and to dates are required.' });
  }

  try {
    const facultyId = await getFacultyId(req.user.id);

    // Authorization: only report on subjects this faculty member teaches.
    const [subjectRows] = await pool.query(
      'SELECT id, name, code FROM subjects WHERE id = ? AND faculty_id = ?',
      [subjectId, facultyId]
    );
    if (!subjectRows[0]) return res.status(403).json({ message: 'You are not assigned to this subject.' });

    // Every distinct date attendance was actually taken on, within range.
    const [sessionRows] = await pool.query(
      `SELECT DISTINCT date FROM attendance WHERE subject_id = ? AND date BETWEEN ? AND ? ORDER BY date`,
      [subjectId, from, to]
    );
    const sessionDates = sessionRows.map((r) => r.date);

    // Per-student present/late/absent counts and percentage over that range.
    const [studentRows] = await pool.query(
      `SELECT st.id AS studentId, st.student_no, u.name,
              SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS presentCount,
              SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS lateCount,
              SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absentCount,
              COUNT(a.id) AS totalMarked
       FROM enrollments en
       JOIN students st ON st.id = en.student_id
       JOIN users u ON u.id = st.user_id
       LEFT JOIN attendance a ON a.student_id = st.id AND a.subject_id = en.subject_id
              AND a.date BETWEEN ? AND ?
       WHERE en.subject_id = ?
       GROUP BY st.id, st.student_no, u.name
       ORDER BY st.student_no`,
      [from, to, subjectId]
    );

    const totalSessions = sessionDates.length;
    const students = studentRows.map((r) => ({
      studentId: r.studentId,
      student_no: r.student_no,
      name: r.name,
      present: r.presentCount,
      late: r.lateCount,
      absent: r.absentCount,
      totalSessions,
      percentage: totalSessions > 0 ? Math.round((r.presentCount / totalSessions) * 1000) / 10 : null
    }));

    res.json({
      subjectName: subjectRows[0].name,
      subjectCode: subjectRows[0].code,
      from,
      to,
      totalSessions,
      sessionDates,
      students
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while generating the attendance report.' });
  }
}

async function markAttendance(req, res) {
  const { subjectId, date, records } = req.body; // records: [{ studentId, status }]
  if (!subjectId || !date || !Array.isArray(records)) {
    return res.status(400).json({ message: 'subjectId, date and records array are required.' });
  }

  if (!isWithinEditWindow(date)) {
    return res.status(403).json({
      message: `Attendance older than ${ATTENDANCE_EDIT_WINDOW_DAYS} days can no longer be edited. Use the Attendance Report page to view it.`
    });
  }

  try {
    const facultyId = await getFacultyId(req.user.id);
    for (const r of records) {
      await pool.query(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)`,
        [r.studentId, subjectId, date, r.status, facultyId]
      );
    }
    await logActivity(req.user.id, 'MARK_ATTENDANCE', `Marked attendance for subject #${subjectId} on ${date}`);
    res.json({ message: 'Attendance saved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while saving attendance.' });
  }
}

/* ---------------------------------------------------------- */
/* MARKS                                                          */
/* ---------------------------------------------------------- */
async function getMarksForSubject(req, res) {
  const { subjectId } = req.query;
  if (!subjectId) return res.status(400).json({ message: 'subjectId is required.' });
  try {
    const [rows] = await pool.query(
      `SELECT st.id AS studentId, st.student_no, u.name,
              MAX(CASE WHEN m.exam_type='internal' THEN m.internal_marks END) AS internalMarks,
              MAX(CASE WHEN m.exam_type='final' THEN m.exam_marks END) AS examMarks
       FROM enrollments en
       JOIN students st ON st.id = en.student_id
       JOIN users u ON u.id = st.user_id
       LEFT JOIN marks m ON m.student_id = st.id AND m.subject_id = en.subject_id
       WHERE en.subject_id = ?
       GROUP BY st.id, st.student_no, u.name
       ORDER BY st.student_no`,
      [subjectId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while loading marks.' });
  }
}

async function saveMarks(req, res) {
  const { subjectId, records } = req.body; // records: [{ studentId, internalMarks, examMarks }]
  if (!subjectId || !Array.isArray(records)) {
    return res.status(400).json({ message: 'subjectId and records array are required.' });
  }
  try {
    const facultyId = await getFacultyId(req.user.id);
    // Ensure subject belongs to this faculty
    const [subjectRows] = await pool.query('SELECT id FROM subjects WHERE id = ? AND faculty_id = ?', [subjectId, facultyId]);
    if (!subjectRows[0]) {
      return res.status(403).json({ message: 'You are not authorized to modify marks for this subject.' });
    }
    const invalid = [];
    for (const r of records) {
      // validate studentId
      const sid = Number(r.studentId) || 0;
      if (!Number.isInteger(sid) || sid <= 0) {
        invalid.push(sid || r.studentId);
        continue;
      }

      // ensure student is enrolled in the subject
      const [enr] = await pool.query('SELECT 1 FROM enrollments WHERE student_id = ? AND subject_id = ? LIMIT 1', [sid, subjectId]);
      if (!enr[0]) {
        invalid.push(sid);
        continue;
      }

      if (r.internalMarks !== undefined && r.internalMarks !== null && r.internalMarks !== '') {
        await pool.query(
          `INSERT INTO marks (student_id, subject_id, exam_type, internal_marks, graded_by)
           VALUES (?, ?, 'internal', ?, ?)
           ON DUPLICATE KEY UPDATE internal_marks = VALUES(internal_marks), graded_by = VALUES(graded_by)`,
          [r.studentId, subjectId, r.internalMarks, facultyId]
        );
      }
      if (r.examMarks !== undefined && r.examMarks !== null && r.examMarks !== '') {
        await pool.query(
          `INSERT INTO marks (student_id, subject_id, exam_type, exam_marks, graded_by)
           VALUES (?, ?, 'final', ?, ?)
           ON DUPLICATE KEY UPDATE exam_marks = VALUES(exam_marks), graded_by = VALUES(graded_by)`,
          [r.studentId, subjectId, r.examMarks, facultyId]
        );
      }
    }
    if (invalid.length > 0) {
      return res.status(400).json({ message: 'Some records were invalid or students not enrolled.', invalid });
    }
    await logActivity(req.user.id, 'ENTER_MARKS', `Updated marks for subject #${subjectId}`);
    res.json({ message: 'Marks saved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while saving marks.' });
  }
}

/* ---------------------------------------------------------- */
/* MATERIALS                                                       */
/* ---------------------------------------------------------- */
async function listMaterials(req, res) {
  try {
    const facultyId = await getFacultyId(req.user.id);
    const [rows] = await pool.query(
      `SELECT m.*, s.name AS subjectName, s.code AS subjectCode
       FROM materials m JOIN subjects s ON s.id = m.subject_id
       WHERE m.faculty_id = ? ORDER BY m.uploaded_at DESC`,
      [facultyId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing materials.' });
  }
}

async function uploadMaterial(req, res) {
  const { subjectId, title, description } = req.body;
  if (!subjectId || !title || !req.file) {
    return res.status(400).json({ message: 'subjectId, title and a file are required.' });
  }
  try {
    const facultyId = await getFacultyId(req.user.id);
    const relativePath = path.join('materials', req.file.filename).replace(/\\/g, '/');
    const [result] = await pool.query(
      'INSERT INTO materials (subject_id, faculty_id, title, description, file_path, file_name) VALUES (?, ?, ?, ?, ?, ?)',
      [subjectId, facultyId, title, description || null, relativePath, req.file.originalname]
    );
    await logActivity(req.user.id, 'UPLOAD_MATERIAL', `Uploaded "${title}" for subject #${subjectId}`);
    res.status(201).json({ id: result.insertId, message: 'Material uploaded successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while uploading material.' });
  }
}

async function deleteMaterial(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM materials WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Material not found.' });
    await pool.query('DELETE FROM materials WHERE id = ?', [id]);

    fs.unlink(path.join(__dirname, '..', 'uploads', rows[0].file_path), () => {}); // best-effort cleanup

    await logActivity(req.user.id, 'DELETE_MATERIAL', `Removed material #${id}`);
    res.json({ message: 'Material removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting material.' });
  }
}

/* ---------------------------------------------------------- */
/* NOTES (personal)                                                */
/* ---------------------------------------------------------- */
async function listNotes(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing notes.' });
  }
}

async function createNote(req, res) {
  const { title, content, isShared } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO notes (user_id, title, content, is_shared) VALUES (?, ?, ?, ?)',
      [req.user.id, title, content || '', !!isShared]
    );
    res.status(201).json({ id: result.insertId, message: 'Note created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating note.' });
  }
}

async function updateNote(req, res) {
  const { id } = req.params;
  const { title, content, isShared } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Note not found.' });
    await pool.query('UPDATE notes SET title = ?, content = ?, is_shared = ? WHERE id = ?', [
      title, content || '', !!isShared, id,
    ]);
    res.json({ message: 'Note updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating note.' });
  }
}

async function deleteNote(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting note.' });
  }
}

module.exports = {
  getProfile, updateProfile,
  getMySubjects,
  searchStudents,
  getAttendanceForSession, markAttendance, getAttendanceReport,
  getMarksForSubject, saveMarks,
  listMaterials, uploadMaterial, deleteMaterial,
  listNotes, createNote, updateNote, deleteNote,
};
