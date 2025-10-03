-- Add new demographic fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS language_dialect VARCHAR(50) CHECK (language_dialect IN ('Milambo', 'Nyanduat')),
ADD COLUMN IF NOT EXISTS educational_background VARCHAR(50) CHECK (educational_background IN ('graduate', 'postgraduate', 'tertiary')),
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) CHECK (employment_status IN ('student', 'employed', 'unemployed')),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_users_language_dialect ON users(language_dialect);
CREATE INDEX IF NOT EXISTS idx_users_educational_background ON users(educational_background);
CREATE INDEX IF NOT EXISTS idx_users_employment_status ON users(employment_status); 