-- Add constituency column to users table
-- Migration: 007_add_constituency_column.sql
-- Description: Add constituency field to store user's constituency information

-- Add constituency column to users table
ALTER TABLE users 
ADD COLUMN constituency TEXT;

-- Add comment to document the column
COMMENT ON COLUMN users.constituency IS 'User constituency within their county (Kenya)';

-- Create index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_users_constituency ON users(constituency);

-- Update any existing users to have NULL constituency (they can update it later)
-- No action needed as new column will be NULL by default
