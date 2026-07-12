const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { logActivity } = require('../utils/activityLogger');
const { ensureAuthSchema, generateAndSendOtp, verifyOtpRecord } = require('../utils/otp');

/**
 * POST /api/auth/login
 * Validates credentials against the users table and issues a JWT.
 * Also resolves role-specific profile ids (student_id / faculty_id)
 * so the frontend can immediately query role-scoped endpoints.
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.is_verified === 0) {
      return res.status(403).json({ message: 'This account is not verified yet. Complete OTP verification first.' });
    }

    if (Number(user.status) !== 1) {
      return res.status(403).json({ message: 'Your account is awaiting admin approval.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    let profile = { id: user.id, name: user.name, email: user.email, role: user.role, avatarColor: user.avatar_color };

    if (user.role === 'student') {
      const [s] = await pool.query(
        `SELECT st.id AS studentId, st.student_no, st.semester, b.name AS branchName, b.id as branchId
         FROM students st LEFT JOIN branches b ON b.id = st.branch_id WHERE st.user_id = ?`,
        [user.id]
      );
      profile = { ...profile, ...s[0] };
    } else if (user.role === 'faculty') {
      const [f] = await pool.query(
        `SELECT f.id AS facultyId, f.faculty_no, f.designation, b.name AS branchName, b.id as branchId
         FROM faculty f LEFT JOIN branches b ON b.id = f.branch_id WHERE f.user_id = ?`,
        [user.id]
      );
      profile = { ...profile, ...f[0] };
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await logActivity(user.id, 'LOGIN', `${user.role} logged in`);

    res.json({ token, user: profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while logging in.' });
  }
}

async function register(req, res) {
  const { name, email, password, role = 'student', captchaToken } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  if (!['student', 'faculty'].includes(role)) {
    return res.status(400).json({ message: 'Only student or faculty roles can be registered.' });
  }

  try {
    await ensureAuthSchema();

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);

    if (existing[0]) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, status, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
      [String(name).trim(), normalizedEmail, hashedPassword, role, 0, 0]
    );

    const contact = normalizedEmail;
    await generateAndSendOtp(contact, { name: String(name).trim() });

    res.status(201).json({
      message: 'Account created. Verify the OTP sent to your email to complete registration.',
      userId: result.insertId,
      contact
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating the account.' });
  }
}

async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const contact = email;

  if (!contact || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const normalizedContact = String(contact).trim().toLowerCase();
    const verification = await verifyOtpRecord(normalizedContact, String(otp).trim());
    if (!verification.ok) {
      return res.status(400).json({ message: verification.message });
    }

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedContact]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'No account was found for this email.' });
    }

    // Mark the contact as verified. Approval status (0/1) is left untouched
    // here — it's controlled solely by the admin from the Users page.
    await pool.query('UPDATE users SET is_verified = 1 WHERE id = ?', [rows[0].id]);
    res.json({ message: 'OTP verified successfully. Your account is awaiting admin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while verifying OTP.' });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  const contact = email;

  if (!contact) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const normalizedContact = String(contact).trim().toLowerCase();
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedContact]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'No account found for the provided email.' });
    }

    await generateAndSendOtp(normalizedContact, { name: 'user' });
    res.json({ message: 'OTP sent to your email for password reset.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while sending reset OTP.' });
  }
}

async function verifyResetOtp(req, res) {
  const { email, otp } = req.body;
  const contact = email;

  if (!contact || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const normalizedContact = String(contact).trim().toLowerCase();
    const verification = await verifyOtpRecord(normalizedContact, String(otp).trim());
    if (!verification.ok) {
      return res.status(400).json({ message: verification.message });
    }

    res.json({ message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while verifying reset OTP.' });
  }
}

async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;
  const contact = email;

  if (!contact || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP and new password are required.' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  try {
    const normalizedContact = String(contact).trim().toLowerCase();
    const verification = await verifyOtpRecord(normalizedContact, String(otp).trim());
    if (!verification.ok) {
      return res.status(400).json({ message: verification.message });
    }

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedContact]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'No account found for the provided email.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, rows[0].id]);

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while resetting the password.' });
  }
}

/**
 * GET /api/auth/me
 * Returns the freshest profile data for the currently authenticated user.
 */
async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, avatar_color FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found.' });

    let profile = rows[0];
    if (profile.role === 'student') {
      const [s] = await pool.query(
        `SELECT st.id AS studentId, st.student_no, st.semester, st.enrollment_date, b.name AS branchName
         FROM students st LEFT JOIN branches b ON b.id = st.branch_id WHERE st.user_id = ?`,
        [req.user.id]
      );
      profile = { ...profile, ...s[0] };
    } else if (profile.role === 'faculty') {
      const [f] = await pool.query(
        `SELECT f.id AS facultyId, f.faculty_no, f.designation, b.name AS branchName
         FROM faculty f LEFT JOIN branches b ON b.id = f.branch_id WHERE f.user_id = ?`,
        [req.user.id]
      );
      profile = { ...profile, ...f[0] };
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
}

/**
 * PUT /api/auth/change-password
 */
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    await logActivity(req.user.id, 'CHANGE_PASSWORD', 'User changed their password');

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while changing password.' });
  }
}

module.exports = {
  login,
  register,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMe,
  changePassword
};
