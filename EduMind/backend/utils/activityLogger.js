const pool = require('../config/db');

/**
 * Records an entry in activity_logs for auditing (admin dashboard reads these).
 */
async function logActivity(userId, action, details = '') {
  try {
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, details]
    );
  } catch (err) {
    // Logging failures should never break the main request flow.
    console.error('Failed to write activity log:', err.message);
  }
}

module.exports = { logActivity };
