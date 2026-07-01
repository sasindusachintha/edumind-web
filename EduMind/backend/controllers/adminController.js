const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

/* ---------------------------------------------------------- */
/* DASHBOARD OVERVIEW                                          */
/* ---------------------------------------------------------- */
async function getDashboardStats(req, res) {
  try {
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) AS totalStudents FROM students');
    const [[{ totalFaculty }]] = await pool.query('SELECT COUNT(*) AS totalFaculty FROM faculty');
    const [[{ totalBranches }]] = await pool.query('SELECT COUNT(*) AS totalBranches FROM branches');
    const [[{ totalSubjects }]] = await pool.query('SELECT COUNT(*) AS totalSubjects FROM subjects');
    const [[{ avgAttendance }]] = await pool.query(
      `SELECT ROUND(AVG(CASE WHEN status = 'present' OR status='late' THEN 1 ELSE 0 END) * 100, 1) AS avgAttendance FROM attendance`
    );
    const [[{ noticeCount }]] = await pool.query('SELECT COUNT(*) AS noticeCount FROM notices');

    const [branchBreakdown] = await pool.query(
      `SELECT b.name AS branch, COUNT(s.id) AS students
       FROM branches b LEFT JOIN students s ON s.branch_id = b.id
       GROUP BY b.id, b.name`
    );

    const [attendanceTrend] = await pool.query(
      `SELECT date, ROUND(AVG(CASE WHEN status='present' OR status='late' THEN 1 ELSE 0 END) * 100, 1) AS rate
       FROM attendance GROUP BY date ORDER BY date ASC`
    );

    const [recentNotices] = await pool.query(
      `SELECT n.id, n.title, n.audience, n.created_at, u.name AS postedBy
       FROM notices n JOIN users u ON u.id = n.posted_by ORDER BY n.created_at DESC LIMIT 5`
    );

    res.json({
      totalStudents,
      totalFaculty,
      totalBranches,
      totalSubjects,
      avgAttendance: avgAttendance || 0,
      noticeCount,
      branchBreakdown,
      attendanceTrend,
      recentNotices,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while loading dashboard stats.' });
  }
}

/* ---------------------------------------------------------- */
/* STUDENTS CRUD                                                */
/* ---------------------------------------------------------- */
async function listStudents(req, res) {
  try {
    const { search = '', branchId = '' } = req.query;
    let sql = `
      SELECT st.id, st.student_no, st.semester, st.enrollment_date,
             u.id AS userId, u.name, u.email, u.phone, u.status,
             b.id AS branchId, b.name AS branchName
      FROM students st
      JOIN users u ON u.id = st.user_id
      LEFT JOIN branches b ON b.id = st.branch_id
      WHERE (u.name LIKE ? OR st.student_no LIKE ? OR u.email LIKE ?)
    `;
    const params = [`%${search}%`, `%${search}%`, `%${search}%`];
    if (branchId) {
      sql += ' AND st.branch_id = ?';
      params.push(branchId);
    }
    sql += ' ORDER BY st.id DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing students.' });
  }
}

async function createStudent(req, res) {
  const { name, email, password, phone, studentNo, branchId, semester, enrollmentDate } = req.body;
  if (!name || !email || !password || !studentNo) {
    return res.status(400).json({ message: 'Name, email, password and student number are required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password, role, phone, avatar_color) VALUES (?, ?, ?, "student", ?, "#F0A500")',
      [name, email, hash, phone || null]
    );
    const [studentResult] = await conn.query(
      'INSERT INTO students (user_id, student_no, branch_id, semester, enrollment_date) VALUES (?, ?, ?, ?, ?)',
      [userResult.insertId, studentNo, branchId || null, semester || 1, enrollmentDate || new Date()]
    );
    await conn.commit();
    await logActivity(req.user.id, 'CREATE_STUDENT', `Added student ${studentNo} - ${name}`);
    res.status(201).json({ id: studentResult.insertId, userId: userResult.insertId, message: 'Student created successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A user with this email or student number already exists.' });
    }
    res.status(500).json({ message: 'Server error while creating student.' });
  } finally {
    conn.release();
  }
}

async function updateStudent(req, res) {
  const { id } = req.params;
  const { name, email, phone, branchId, semester, status } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Student not found.' });

    await pool.query('UPDATE users SET name = ?, email = ?, phone = ?, status = ? WHERE id = ?', [
      name, email, phone || null, status || 'active', rows[0].user_id,
    ]);
    await pool.query('UPDATE students SET branch_id = ?, semester = ? WHERE id = ?', [
      branchId || null, semester || 1, id,
    ]);
    await logActivity(req.user.id, 'UPDATE_STUDENT', `Updated student record #${id}`);
    res.json({ message: 'Student updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating student.' });
  }
}

async function deleteStudent(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Student not found.' });
    await pool.query('DELETE FROM users WHERE id = ?', [rows[0].user_id]); // cascades to students table
    await logActivity(req.user.id, 'DELETE_STUDENT', `Removed student record #${id}`);
    res.json({ message: 'Student removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting student.' });
  }
}

/* ---------------------------------------------------------- */
/* FACULTY CRUD                                                 */
/* ---------------------------------------------------------- */
async function listFaculty(req, res) {
  try {
    const { search = '' } = req.query;
    const [rows] = await pool.query(
      `SELECT f.id, f.faculty_no, f.designation,
              u.id AS userId, u.name, u.email, u.phone, u.status,
              b.id AS branchId, b.name AS branchName,
              (SELECT COUNT(*) FROM subjects s WHERE s.faculty_id = f.id) AS subjectCount
       FROM faculty f
       JOIN users u ON u.id = f.user_id
       LEFT JOIN branches b ON b.id = f.branch_id
       WHERE u.name LIKE ? OR f.faculty_no LIKE ? OR u.email LIKE ?
       ORDER BY f.id DESC`,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing faculty.' });
  }
}

async function createFaculty(req, res) {
  const { name, email, password, phone, facultyNo, designation, branchId } = req.body;
  if (!name || !email || !password || !facultyNo) {
    return res.status(400).json({ message: 'Name, email, password and faculty number are required.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password, role, phone, avatar_color) VALUES (?, ?, ?, "faculty", ?, "#00897B")',
      [name, email, hash, phone || null]
    );
    const [facResult] = await conn.query(
      'INSERT INTO faculty (user_id, faculty_no, designation, branch_id) VALUES (?, ?, ?, ?)',
      [userResult.insertId, facultyNo, designation || 'Lecturer', branchId || null]
    );
    await conn.commit();
    await logActivity(req.user.id, 'CREATE_FACULTY', `Added faculty ${facultyNo} - ${name}`);
    res.status(201).json({ id: facResult.insertId, userId: userResult.insertId, message: 'Faculty created successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A user with this email or faculty number already exists.' });
    }
    res.status(500).json({ message: 'Server error while creating faculty.' });
  } finally {
    conn.release();
  }
}

async function updateFaculty(req, res) {
  const { id } = req.params;
  const { name, email, phone, designation, branchId, status } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM faculty WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Faculty not found.' });

    await pool.query('UPDATE users SET name = ?, email = ?, phone = ?, status = ? WHERE id = ?', [
      name, email, phone || null, status || 'active', rows[0].user_id,
    ]);
    await pool.query('UPDATE faculty SET designation = ?, branch_id = ? WHERE id = ?', [
      designation || 'Lecturer', branchId || null, id,
    ]);
    await logActivity(req.user.id, 'UPDATE_FACULTY', `Updated faculty record #${id}`);
    res.json({ message: 'Faculty updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating faculty.' });
  }
}

async function deleteFaculty(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM faculty WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Faculty not found.' });
    await pool.query('DELETE FROM users WHERE id = ?', [rows[0].user_id]);
    await logActivity(req.user.id, 'DELETE_FACULTY', `Removed faculty record #${id}`);
    res.json({ message: 'Faculty removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting faculty.' });
  }
}

/* ---------------------------------------------------------- */
/* BRANCHES CRUD                                                */
/* ---------------------------------------------------------- */
async function listBranches(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, (SELECT COUNT(*) FROM students s WHERE s.branch_id = b.id) AS studentCount,
              (SELECT COUNT(*) FROM subjects s WHERE s.branch_id = b.id) AS subjectCount
       FROM branches b ORDER BY b.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing branches.' });
  }
}

async function createBranch(req, res) {
  const { name, code, description } = req.body;
  if (!name || !code) return res.status(400).json({ message: 'Branch name and code are required.' });
  try {
    const [result] = await pool.query('INSERT INTO branches (name, code, description) VALUES (?, ?, ?)', [
      name, code, description || null,
    ]);
    await logActivity(req.user.id, 'CREATE_BRANCH', `Added branch ${code} - ${name}`);
    res.status(201).json({ id: result.insertId, message: 'Branch created successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Branch code already exists.' });
    res.status(500).json({ message: 'Server error while creating branch.' });
  }
}

async function updateBranch(req, res) {
  const { id } = req.params;
  const { name, code, description } = req.body;
  try {
    await pool.query('UPDATE branches SET name = ?, code = ?, description = ? WHERE id = ?', [
      name, code, description || null, id,
    ]);
    await logActivity(req.user.id, 'UPDATE_BRANCH', `Updated branch #${id}`);
    res.json({ message: 'Branch updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating branch.' });
  }
}

async function deleteBranch(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM branches WHERE id = ?', [id]);
    await logActivity(req.user.id, 'DELETE_BRANCH', `Removed branch #${id}`);
    res.json({ message: 'Branch removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting branch.' });
  }
}

/* ---------------------------------------------------------- */
/* SUBJECTS CRUD                                                */
/* ---------------------------------------------------------- */
async function listSubjects(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT sub.*, b.name AS branchName, f.faculty_no, u.name AS facultyName
       FROM subjects sub
       LEFT JOIN branches b ON b.id = sub.branch_id
       LEFT JOIN faculty f ON f.id = sub.faculty_id
       LEFT JOIN users u ON u.id = f.user_id
       ORDER BY sub.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing subjects.' });
  }
}

async function createSubject(req, res) {
  const { name, code, credits, semester, branchId, facultyId } = req.body;
  if (!name || !code) return res.status(400).json({ message: 'Subject name and code are required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO subjects (name, code, credits, semester, branch_id, faculty_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, code, credits || 3, semester || 1, branchId || null, facultyId || null]
    );
    await logActivity(req.user.id, 'CREATE_SUBJECT', `Added subject ${code} - ${name}`);
    res.status(201).json({ id: result.insertId, message: 'Subject created successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Subject code already exists.' });
    res.status(500).json({ message: 'Server error while creating subject.' });
  }
}

async function updateSubject(req, res) {
  const { id } = req.params;
  const { name, code, credits, semester, branchId, facultyId } = req.body;
  try {
    await pool.query(
      'UPDATE subjects SET name=?, code=?, credits=?, semester=?, branch_id=?, faculty_id=? WHERE id=?',
      [name, code, credits || 3, semester || 1, branchId || null, facultyId || null, id]
    );
    await logActivity(req.user.id, 'UPDATE_SUBJECT', `Updated subject #${id}`);
    res.json({ message: 'Subject updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating subject.' });
  }
}

async function deleteSubject(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM subjects WHERE id = ?', [id]);
    await logActivity(req.user.id, 'DELETE_SUBJECT', `Removed subject #${id}`);
    res.json({ message: 'Subject removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting subject.' });
  }
}

/* ---------------------------------------------------------- */
/* NOTICES                                                      */
/* ---------------------------------------------------------- */
async function listNotices(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.name AS postedBy FROM notices n JOIN users u ON u.id = n.posted_by ORDER BY n.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing notices.' });
  }
}

async function createNotice(req, res) {
  const { title, content, audience } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content are required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO notices (title, content, audience, posted_by) VALUES (?, ?, ?, ?)',
      [title, content, audience || 'all', req.user.id]
    );
    await logActivity(req.user.id, 'PUBLISH_NOTICE', `Published notice: ${title}`);
    res.status(201).json({ id: result.insertId, message: 'Notice published successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating notice.' });
  }
}

async function deleteNotice(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notices WHERE id = ?', [id]);
    await logActivity(req.user.id, 'DELETE_NOTICE', `Removed notice #${id}`);
    res.json({ message: 'Notice removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting notice.' });
  }
}

/* ---------------------------------------------------------- */
/* EXAMS                                                        */
/* ---------------------------------------------------------- */
async function listExams(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, s.name AS subjectName, s.code AS subjectCode, b.name as branchName
       FROM exams e JOIN subjects s ON s.id = e.subject_id LEFT JOIN branches b ON b.id = s.branch_id
       ORDER BY e.exam_date ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing exams.' });
  }
}

async function createExam(req, res) {
  const { subjectId, examDate, startTime, durationMinutes, venue } = req.body;
  if (!subjectId || !examDate || !startTime) {
    return res.status(400).json({ message: 'Subject, date and start time are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO exams (subject_id, exam_date, start_time, duration_minutes, venue) VALUES (?, ?, ?, ?, ?)',
      [subjectId, examDate, startTime, durationMinutes || 120, venue || null]
    );
    await logActivity(req.user.id, 'CREATE_EXAM', `Scheduled exam for subject #${subjectId} on ${examDate}`);
    res.status(201).json({ id: result.insertId, message: 'Exam scheduled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while scheduling exam.' });
  }
}

async function deleteExam(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM exams WHERE id = ?', [id]);
    await logActivity(req.user.id, 'DELETE_EXAM', `Removed exam #${id}`);
    res.json({ message: 'Exam removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting exam.' });
  }
}

/* ---------------------------------------------------------- */
/* ACTIVITY LOGS                                                */
/* ---------------------------------------------------------- */
async function listLogs(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, u.name AS userName, u.role FROM activity_logs l
       LEFT JOIN users u ON u.id = l.user_id ORDER BY l.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while listing activity logs.' });
  }
}

/* ---------------------------------------------------------- */
/* REPORTS                                                      */
/* ---------------------------------------------------------- */
async function attendanceSummaryReport(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT st.id AS studentId, st.student_no, u.name, b.name AS branchName,
              COUNT(a.id) AS totalSessions,
              SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END) AS attended,
              ROUND(SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END) / COUNT(a.id) * 100, 1) AS percentage
       FROM students st
       JOIN users u ON u.id = st.user_id
       LEFT JOIN branches b ON b.id = st.branch_id
       LEFT JOIN attendance a ON a.student_id = st.id
       GROUP BY st.id, st.student_no, u.name, b.name
       ORDER BY percentage ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while generating attendance report.' });
  }
}

async function performanceReport(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT sub.name AS subjectName, sub.code,
              ROUND(AVG(m.internal_marks), 1) AS avgInternal,
              ROUND(AVG(m.exam_marks), 1) AS avgExam,
              COUNT(DISTINCT m.student_id) AS studentsGraded
       FROM subjects sub
       LEFT JOIN marks m ON m.subject_id = sub.id
       GROUP BY sub.id, sub.name, sub.code
       ORDER BY sub.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while generating performance report.' });
  }
}

module.exports = {
  getDashboardStats,
  listStudents, createStudent, updateStudent, deleteStudent,
  listFaculty, createFaculty, updateFaculty, deleteFaculty,
  listBranches, createBranch, updateBranch, deleteBranch,
  listSubjects, createSubject, updateSubject, deleteSubject,
  listNotices, createNotice, deleteNotice,
  listExams, createExam, deleteExam,
  listLogs,
  attendanceSummaryReport, performanceReport,
};
