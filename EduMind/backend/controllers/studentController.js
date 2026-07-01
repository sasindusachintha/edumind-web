const pool = require('../config/db');

async function getStudentId(userId) {
  const [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
  return rows[0]?.id;
}

/* ---------------------------------------------------------- */
/* PROFILE                                                        */
/* ---------------------------------------------------------- */
async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT st.id AS studentId, st.student_no, st.semester, st.enrollment_date,
              u.name, u.email, u.phone, u.avatar_color,
              b.id AS branchId, b.name AS branchName
       FROM students st JOIN users u ON u.id = st.user_id LEFT JOIN branches b ON b.id = st.branch_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Student profile not found.' });
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
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
}

/* ---------------------------------------------------------- */
/* DASHBOARD OVERVIEW                                              */
/* ---------------------------------------------------------- */
async function getOverview(req, res) {
  try {
    const studentId = await getStudentId(req.user.id);

    const [[{ overallAttendance }]] = await pool.query(
      `SELECT ROUND(AVG(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) * 100, 1) AS overallAttendance
       FROM attendance WHERE student_id = ?`,
      [studentId]
    );

    const [subjects] = await pool.query(
      `SELECT s.id, s.name, s.code FROM enrollments e JOIN subjects s ON s.id = e.subject_id WHERE e.student_id = ?`,
      [studentId]
    );

    const [upcomingExams] = await pool.query(
      `SELECT ex.*, s.name AS subjectName, s.code AS subjectCode
       FROM exams ex JOIN subjects s ON s.id = ex.subject_id
       JOIN enrollments e ON e.subject_id = s.id
       WHERE e.student_id = ? AND ex.exam_date >= CURDATE()
       ORDER BY ex.exam_date ASC LIMIT 5`,
      [studentId]
    );

    const [recentMarks] = await pool.query(
      `SELECT s.name AS subjectName, m.exam_type, m.internal_marks, m.exam_marks
       FROM marks m JOIN subjects s ON s.id = m.subject_id WHERE m.student_id = ? ORDER BY m.updated_at DESC LIMIT 5`,
      [studentId]
    );

    res.json({
      overallAttendance: overallAttendance || 0,
      subjectCount: subjects.length,
      upcomingExams,
      recentMarks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while loading overview.' });
  }
}

/* ---------------------------------------------------------- */
/* SCHEDULE (subjects + exam timetable)                              */
/* ---------------------------------------------------------- */
async function getSchedule(req, res) {
  try {
    const studentId = await getStudentId(req.user.id);
    const [subjects] = await pool.query(
      `SELECT s.id, s.name, s.code, s.credits, u.name AS facultyName
       FROM enrollments e JOIN subjects s ON s.id = e.subject_id
       LEFT JOIN faculty f ON f.id = s.faculty_id LEFT JOIN users u ON u.id = f.user_id
       WHERE e.student_id = ? ORDER BY s.name`,
      [studentId]
    );
    const [exams] = await pool.query(
      `SELECT ex.*, s.name AS subjectName, s.code AS subjectCode
       FROM exams ex JOIN subjects s ON s.id = ex.subject_id JOIN enrollments e ON e.subject_id = s.id
       WHERE e.student_id = ? ORDER BY ex.exam_date ASC`,
      [studentId]
    );
    res.json({ subjects, exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching schedule.' });
  }
}

/* ---------------------------------------------------------- */
/* MATERIALS                                                        */
/* ---------------------------------------------------------- */
async function getMaterials(req, res) {
  try {
    const studentId = await getStudentId(req.user.id);
    const [rows] = await pool.query(
      `SELECT m.*, s.name AS subjectName, s.code AS subjectCode
       FROM materials m JOIN subjects s ON s.id = m.subject_id
       JOIN enrollments e ON e.subject_id = s.id
       WHERE e.student_id = ? ORDER BY m.uploaded_at DESC`,
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching materials.' });
  }
}

/* ---------------------------------------------------------- */
/* NOTICES                                                          */
/* ---------------------------------------------------------- */
async function getNotices(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.name AS postedBy FROM notices n JOIN users u ON u.id = n.posted_by
       WHERE n.audience IN ('all', 'students') ORDER BY n.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching notices.' });
  }
}

/* ---------------------------------------------------------- */
/* ATTENDANCE                                                        */
/* ---------------------------------------------------------- */
async function getAttendance(req, res) {
  try {
    const studentId = await getStudentId(req.user.id);
    const [bySubject] = await pool.query(
      `SELECT s.id AS subjectId, s.name AS subjectName, s.code,
              COUNT(a.id) AS totalSessions,
              SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END) AS attended,
              ROUND(SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END) / COUNT(a.id) * 100, 1) AS percentage
       FROM enrollments e JOIN subjects s ON s.id = e.subject_id
       LEFT JOIN attendance a ON a.subject_id = s.id AND a.student_id = e.student_id
       WHERE e.student_id = ? GROUP BY s.id, s.name, s.code`,
      [studentId]
    );
    const [records] = await pool.query(
      `SELECT a.date, a.status, s.name AS subjectName, s.code
       FROM attendance a JOIN subjects s ON s.id = a.subject_id
       WHERE a.student_id = ? ORDER BY a.date DESC LIMIT 50`,
      [studentId]
    );
    res.json({ bySubject, records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching attendance.' });
  }
}

/* ---------------------------------------------------------- */
/* MARKS                                                              */
/* ---------------------------------------------------------- */
async function getMarks(req, res) {
  try {
    const studentId = await getStudentId(req.user.id);
    const [rows] = await pool.query(
      `SELECT s.name AS subjectName, s.code, s.credits,
              MAX(CASE WHEN m.exam_type='internal' THEN m.internal_marks END) AS internalMarks,
              MAX(CASE WHEN m.exam_type='final' THEN m.exam_marks END) AS examMarks
       FROM enrollments e JOIN subjects s ON s.id = e.subject_id
       LEFT JOIN marks m ON m.subject_id = s.id AND m.student_id = e.student_id
       WHERE e.student_id = ? GROUP BY s.id, s.name, s.code, s.credits`,
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching marks.' });
  }
}

/* ---------------------------------------------------------- */
/* NOTIFICATIONS                                                      */
/* ---------------------------------------------------------- */
async function getNotifications(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching notifications.' });
  }
}

async function markNotificationRead(req, res) {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating notification.' });
  }
}

/* ---------------------------------------------------------- */
/* NOTES (personal, optionally shared)                                 */
/* ---------------------------------------------------------- */
async function listNotes(req, res) {
  try {
    const [own] = await pool.query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
    const [shared] = await pool.query(
      `SELECT n.*, u.name AS authorName FROM notes n JOIN users u ON u.id = n.user_id
       WHERE n.is_shared = TRUE AND n.user_id != ? ORDER BY n.updated_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ own, shared });
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
  getProfile, updateProfile, getOverview, getSchedule,
  getMaterials, getNotices, getAttendance, getMarks,
  getNotifications, markNotificationRead,
  listNotes, createNote, updateNote, deleteNote,
};
