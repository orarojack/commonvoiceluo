# Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           USERS TABLE                           │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ email (VARCHAR(255), UNIQUE, NOT NULL)                         │
│ password (VARCHAR(255), NOT NULL)                              │
│ role (VARCHAR(20), NOT NULL) → 'contributor'|'reviewer'|'admin'│
│ status (VARCHAR(20), NOT NULL) → 'active'|'pending'|'rejected' │
│ profile_complete (BOOLEAN, DEFAULT FALSE)                      │
│ name (VARCHAR(255))                                            │
│ age (VARCHAR(20))                                              │
│ gender (VARCHAR(50))                                           │
│ languages (TEXT[])                                             │
│ created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())           │
│ updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())           │
│ last_login_at (TIMESTAMP WITH TIME ZONE)                       │
│ is_active (BOOLEAN, DEFAULT TRUE)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:N
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RECORDINGS TABLE                         │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ user_id (UUID, FK → users.id, NOT NULL)                        │
│ sentence (TEXT, NOT NULL)                                       │
│ audio_url (TEXT, NOT NULL)                                      │
│ audio_blob (TEXT)                                               │
│ duration (DECIMAL(5,2), NOT NULL)                               │
│ status (VARCHAR(20), NOT NULL) → 'pending'|'approved'|'rejected'│
│ reviewed_by (UUID, FK → users.id)                              │
│ reviewed_at (TIMESTAMP WITH TIME ZONE)                          │
│ created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())            │
│ updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())            │
│ quality (VARCHAR(20), DEFAULT 'good') → 'good'|'fair'|'poor'   │
│ metadata (JSONB, DEFAULT '{}')                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:N
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          REVIEWS TABLE                          │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                   │
│ recording_id (UUID, FK → recordings.id, NOT NULL)               │
│ reviewer_id (UUID, FK → users.id, NOT NULL)                     │
│ decision (VARCHAR(20), NOT NULL) → 'approved'|'rejected'        │
│ notes (TEXT)                                                    │
│ confidence (INTEGER, NOT NULL) → 0-100                          │
│ created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())            │
│ time_spent (INTEGER, NOT NULL, DEFAULT 0)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Relationships

### Primary Relationships
1. **Users → Recordings** (1:N)
   - One user can create many recordings
   - Foreign key: `recordings.user_id` → `users.id`
   - Cascade delete: When user is deleted, their recordings are deleted

2. **Users → Reviews** (1:N)
   - One reviewer can create many reviews
   - Foreign key: `reviews.reviewer_id` → `users.id`
   - Cascade delete: When user is deleted, their reviews are deleted

3. **Recordings → Reviews** (1:N)
   - One recording can have many reviews (for quality control)
   - Foreign key: `reviews.recording_id` → `recordings.id`
   - Cascade delete: When recording is deleted, its reviews are deleted

4. **Users → Recordings (as Reviewer)** (1:N)
   - One reviewer can review many recordings
   - Foreign key: `recordings.reviewed_by` → `users.id`
   - No cascade delete (preserve review history)

## User Role Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Contributor │    │  Reviewer   │    │    Admin    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ Creates           │ Reviews           │ Manages
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Recordings  │    │   Reviews   │    │ User Status │
│ (pending)   │    │ (approved/  │    │ (approve/   │
│             │    │  rejected)  │    │  reject)    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ Updates           │ Updates           │ Updates
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Status:     │    │ Recording   │    │ Reviewer    │
│ approved/   │    │ Status      │    │ Status:     │
│ rejected    │    │             │    │ active/     │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Data Flow

1. **User Registration**
   - Contributor: `status = 'active'`, `is_active = true`
   - Reviewer: `status = 'pending'`, `is_active = true`
   - Admin: `status = 'active'`, `is_active = true`

2. **Recording Submission**
   - Contributor creates recording → `recordings` table
   - Status: `pending`
   - Quality: `good` (default)

3. **Review Process**
   - Reviewer reviews recording → `reviews` table
   - Decision: `approved` or `rejected`
   - Confidence: 0-100
   - Recording status updated based on decision

4. **Admin Management**
   - Admin can approve/reject reviewer applications
   - Updates user `status` and `is_active` fields
   - Can manage all user accounts

## Key Constraints

- **Email uniqueness**: Each user must have a unique email
- **Role validation**: Only 'contributor', 'reviewer', 'admin' allowed
- **Status validation**: Only 'active', 'pending', 'rejected' allowed
- **Decision validation**: Only 'approved', 'rejected' allowed
- **Confidence range**: Must be between 0 and 100
- **Quality validation**: Only 'good', 'fair', 'poor' allowed

## Indexes for Performance

- `idx_users_email`: Fast email lookups for authentication
- `idx_users_role`: Filter users by role
- `idx_users_status`: Filter users by status
- `idx_recordings_user_id`: Get all recordings by user
- `idx_recordings_status`: Filter recordings by status
- `idx_recordings_reviewed_by`: Get recordings reviewed by specific user
- `idx_reviews_recording_id`: Get all reviews for a recording
- `idx_reviews_reviewer_id`: Get all reviews by a reviewer
