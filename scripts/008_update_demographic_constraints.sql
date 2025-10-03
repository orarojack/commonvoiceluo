-- Update demographic field constraints to match new options
-- Migration: 008_update_demographic_constraints.sql
-- Description: Update employment_status and educational_background constraints to include new values

-- First, drop the existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_employment_status_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_educational_background_check;

-- Add updated constraints with new values
ALTER TABLE users 
ADD CONSTRAINT users_employment_status_check 
CHECK (employment_status IN ('employed', 'self-employed', 'unemployed'));

ALTER TABLE users 
ADD CONSTRAINT users_educational_background_check 
CHECK (educational_background IN ('primary', 'secondary', 'tertiary', 'graduate', 'postgraduate'));

-- Add constituency column if it doesn't exist (from previous migration)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS constituency TEXT;

-- Add comment to document the updated constraints
COMMENT ON COLUMN users.employment_status IS 'User employment status: employed, self-employed, or unemployed';
COMMENT ON COLUMN users.educational_background IS 'User education level: primary, secondary, tertiary, graduate, or postgraduate';
COMMENT ON COLUMN users.constituency IS 'User constituency within their county (Kenya)';

-- Create index for constituency if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_constituency ON users(constituency);
