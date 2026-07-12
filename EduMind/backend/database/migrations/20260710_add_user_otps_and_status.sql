-- Migration: add user_otps table and ensure users.status

CREATE TABLE IF NOT EXISTS user_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT DEFAULT 0,
  otp_type ENUM('email', 'sms') DEFAULT 'email',
  purpose ENUM('register','reset') DEFAULT 'register',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_otps_email (email)
);

-- Add status column to users if it doesn't exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status ENUM('pending','approved','disabled') DEFAULT 'pending';

-- Normalize previous active status values to 'approved'
UPDATE users
SET status = CASE WHEN status IN ('active','approved') THEN 'approved' ELSE status END
WHERE status IS NOT NULL;
