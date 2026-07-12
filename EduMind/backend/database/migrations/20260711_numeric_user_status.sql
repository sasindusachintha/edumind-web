-- Migration: replace the pending/approved/disabled string status with a
-- single numeric approval flag.
--   0 = not approved (covers both "still pending" and "disabled by admin")
--   1 = approved / active
-- This is applied automatically at server start by ensureAuthSchema() in
-- backend/utils/otp.js, but is kept here too for manual/CI migrations.

ALTER TABLE users ADD COLUMN IF NOT EXISTS status_tmp TINYINT(1) NOT NULL DEFAULT 0;

UPDATE users
SET status_tmp = CASE WHEN status IN ('active', 'approved') THEN 1 ELSE 0 END;

ALTER TABLE users DROP COLUMN status;
ALTER TABLE users CHANGE COLUMN status_tmp status TINYINT(1) NOT NULL DEFAULT 0;
