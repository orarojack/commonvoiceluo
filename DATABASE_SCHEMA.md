# Voice Platform Database Schema

## Overview
This document describes the complete database schema for the Voice Platform project, which is a voice recording and review system built with Next.js and Supabase.

## Database Technology
- **Database**: PostgreSQL (via Supabase)
- **Extensions**: UUID-OSSP for UUID generation
- **ORM**: Supabase client with TypeScript types

## Tables

### 1. Users Table
**Purpose**: Stores user accounts and authentication information

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('contributor', 'reviewer', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
    profile_complete BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    age VARCHAR(20),
    gender VARCHAR(50),
    languages TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Fields**:
- `id`: Primary key (UUID)
- `email`: Unique email address for login
- `password`: Hashed password (plain text in demo)
- `role`: User type - contributor, reviewer, or admin
- `status`: Account status - active, pending, or rejected
- `profile_complete`: Whether user has completed profile setup
- `name`: User's display name
- `age`: Age range (e.g., "20-29", "30-39")
- `gender`: Gender identity
- `languages`: Array of languages the user speaks
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp (auto-updated)
- `last_login_at`: Last login timestamp
- `is_active`: Whether account is active (controls login access)

**Constraints**:
- Email must be unique
- Role must be one of: contributor, reviewer, admin
- Status must be one of: active, pending, rejected

### 2. Recordings Table
**Purpose**: Stores voice recordings submitted by contributors

```sql
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    audio_blob TEXT,
    duration DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quality VARCHAR(20) DEFAULT 'good' CHECK (quality IN ('good', 'fair', 'poor')),
    metadata JSONB DEFAULT '{}'
);
```

**Fields**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users table (contributor)
- `sentence`: The text that was recorded
- `audio_url`: URL or path to audio file
- `audio_blob`: Base64 encoded audio data (for data URLs)
- `duration`: Recording duration in seconds (decimal)
- `status`: Review status - pending, approved, or rejected
- `reviewed_by`: Foreign key to users table (reviewer)
- `reviewed_at`: When the recording was reviewed
- `created_at`: Recording submission timestamp
- `updated_at`: Last update timestamp (auto-updated)
- `quality`: Audio quality assessment - good, fair, or poor
- `metadata`: JSON object with additional recording metadata

**Constraints**:
- Status must be one of: pending, approved, rejected
- Quality must be one of: good, fair, poor
- Duration must be positive decimal

### 3. Reviews Table
**Purpose**: Stores detailed review information for recordings

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
    notes TEXT,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent INTEGER NOT NULL DEFAULT 0
);
```

**Fields**:
- `id`: Primary key (UUID)
- `recording_id`: Foreign key to recordings table
- `reviewer_id`: Foreign key to users table (reviewer)
- `decision`: Review decision - approved or rejected
- `notes`: Reviewer's notes about the recording
- `confidence`: Reviewer's confidence level (0-100)
- `created_at`: Review creation timestamp
- `time_spent`: Time spent reviewing in seconds

**Constraints**:
- Decision must be one of: approved, rejected
- Confidence must be between 0 and 100

## Indexes
For optimal query performance:

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Recording indexes
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_recordings_reviewed_by ON recordings(reviewed_by);

-- Review indexes
CREATE INDEX idx_reviews_recording_id ON reviews(recording_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
```

## Triggers
Auto-update timestamps:

```sql
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at 
    BEFORE UPDATE ON recordings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Relationships

### User Roles and Workflow
1. **Contributors**: Submit voice recordings
2. **Reviewers**: Review and approve/reject recordings
3. **Admins**: Manage users and system settings

### Data Flow
1. Contributors create recordings → `recordings` table
2. Reviewers review recordings → `reviews` table
3. Recording status updated based on review decision
4. Admin can approve/reject reviewer applications

## Sample Data
The system includes seed data with:
- Admin user: `admin@commonvoice.org` / `admin123`
- Active reviewer: `reviewer@example.com` / `reviewer123`
- Pending reviewer: `pending@example.com` / `pending123`
- Contributors: `contributor@example.com` / `contributor123`, `alice@example.com` / `alice123`

## TypeScript Types
The schema is fully typed in `lib/supabase.ts` with:
- Row types for reading data
- Insert types for creating records
- Update types for modifying records

## Security Considerations
- Passwords are stored in plain text (demo only - use proper hashing in production)
- UUID primary keys prevent enumeration attacks
- Foreign key constraints maintain data integrity
- Row-level security can be implemented via Supabase RLS policies

## Performance Notes
- Indexes on frequently queried columns
- JSONB for flexible metadata storage
- Proper foreign key relationships for data integrity
- Auto-updating timestamps for audit trails
