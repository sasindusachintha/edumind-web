require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const sgMail = require("@sendgrid/mail");

// ================== CONFIG ==================
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ================== OTP GENERATION ==================
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ================== PHONE NORMALIZER ==================
function normalizePhone(phone) {
  if (!phone) return phone;

  const countryCode = (process.env.DEFAULT_COUNTRY_CODE || "94").replace(/\D/g, "");
  let digits = String(phone).trim().replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+${countryCode}${digits.slice(1)}`;
  if (digits.startsWith(countryCode)) return `+${digits}`;

  return `+${countryCode}${digits}`;
}

// ================== DB SETUP ==================
async function ensureAuthSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(150) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts INT DEFAULT 0,
      otp_type ENUM('email', 'sms') DEFAULT 'email',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_otps_email (email)
    )
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS status TINYINT(1) NOT NULL DEFAULT 0
  `);
}

// ================== CLEAR OLD OTP ==================
async function clearExistingOtps(email) {
  await pool.query("DELETE FROM user_otps WHERE email = ?", [email]);
}

// ================== EMAIL OTP ==================
async function sendEmailOtp(contact, otp, name) {
  try {
    const msg = {
      to: contact,
      from: "sasindusachintha1234@gmail.com", // verified sender
      subject: "EduMind OTP",
      text: `Hello ${name || "user"},\n\nYour OTP is ${otp}`,
    };

    await sgMail.send(msg);

    console.log("✅ Email OTP sent:", contact);
    return { ok: true };
  } catch (error) {
    console.error("❌ Email Error:", error.response?.body || error.message);
    throw new Error("Email delivery failed");
  }
}



// ================== GENERATE + SEND ==================
async function generateAndSendOtp(contact, { name = "user" } = {}) {
  const otp = generateOtp();
  const normalized = String(contact).trim().toLowerCase();

  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await clearExistingOtps(normalized);

  await pool.query(
    "INSERT INTO user_otps (email, otp_hash, expires_at, attempts, otp_type) VALUES (?, ?, ?, ?, ?)",
    [normalized, otpHash, expiresAt, 0, 'email']
  );

  await sendEmailOtp(normalized, otp, name);
  return otp;
}

// ================== VERIFY OTP ==================
async function verifyOtpRecord(contact, otp) {
  const normalized = String(contact).trim().toLowerCase();

  const [rows] = await pool.query(
    "SELECT * FROM user_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1",
    [normalized]
  );

  const record = rows[0];

  if (!record) {
    return { ok: false, message: "No OTP found" };
  }

  if (new Date(record.expires_at) < new Date()) {
    await pool.query("DELETE FROM user_otps WHERE id = ?", [record.id]);
    return { ok: false, message: "OTP expired" };
  }

  if (record.attempts >= 5) {
    await pool.query("DELETE FROM user_otps WHERE id = ?", [record.id]);
    return { ok: false, message: "Too many attempts" };
  }

  const match = await bcrypt.compare(otp, record.otp_hash);

  if (!match) {
    await pool.query("UPDATE user_otps SET attempts = attempts + 1 WHERE id = ?", [record.id]);
    return { ok: false, message: "Invalid OTP" };
  }

  await pool.query("DELETE FROM user_otps WHERE id = ?", [record.id]);

  return { ok: true, message: "OTP verified" };
}

// ================== EXPORT ==================
module.exports = {
  ensureAuthSchema,
  generateAndSendOtp,
  verifyOtpRecord,
  normalizePhone,
};