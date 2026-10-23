-- Migration 010: Firebase Authentication, Unique firebase_uid, Email Verification, and Session Revocation
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE NULL,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid
  ON users (firebase_uid)
  WHERE firebase_uid IS NOT NULL;

-- Ensure auth_mode accepts 'token' or 'firebase'
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS chk_users_auth_mode;

ALTER TABLE users
  ADD CONSTRAINT chk_users_auth_mode
  CHECK (auth_mode IN ('otp', 'token', 'preview', 'password', 'firebase'));
