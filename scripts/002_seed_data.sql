-- Insert default admin user with proper UUID
INSERT INTO users (email, password, role, status, profile_complete, name, is_active)
VALUES (
    'admin@commonvoice.org',
    'admin123',
    'admin',
    'active',
    true,
    'System Admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample reviewer with proper UUID
INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, last_login_at, is_active)
VALUES (
    'reviewer@example.com',
    'reviewer123',
    'reviewer',
    'active',
    true,
    'John Reviewer',
    '30-39',
    'male',
    ARRAY['English', 'Spanish'],
    NOW(),
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert pending reviewer with proper UUID
INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, is_active)
VALUES (
    'pending@example.com',
    'pending123',
    'reviewer',
    'pending',
    true,
    'Pending Reviewer',
    '25-29',
    'female',
    ARRAY['English'],
    false
) ON CONFLICT (email) DO NOTHING;

-- Insert sample contributors with proper UUID
INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, last_login_at, is_active)
VALUES (
    'contributor@example.com',
    'contributor123',
    'contributor',
    'active',
    true,
    'Jane Contributor',
    '20-29',
    'female',
    ARRAY['English', 'French'],
    NOW(),
    true
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, last_login_at, is_active)
VALUES (
    'alice@example.com',
    'alice123',
    'contributor',
    'active',
    true,
    'Alice Johnson',
    '30-39',
    'female',
    ARRAY['English'],
    NOW() - INTERVAL '1 day',
    true
) ON CONFLICT (email) DO NOTHING;

-- Get user IDs for recordings (we'll use a different approach)
-- First, let's create some sample recordings with dynamic user IDs

-- Insert sample recordings using subqueries to get proper user IDs
WITH contributor1 AS (
    SELECT id FROM users WHERE email = 'contributor@example.com' LIMIT 1
),
contributor2 AS (
    SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, reviewed_by, reviewed_at, quality, metadata)
SELECT 
    contributor1.id,
    'The quick brown fox jumps over the lazy dog.',
    '/audio/sample1.mp3',
    3.2,
    'approved',
    reviewer1.id,
    NOW() - INTERVAL '1 hour',
    'good',
    '{"deviceType": "desktop", "browserType": "chrome"}'::jsonb
FROM contributor1, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'The quick brown fox jumps over the lazy dog.'
);

WITH contributor1 AS (
    SELECT id FROM users WHERE email = 'contributor@example.com' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, reviewed_by, reviewed_at, quality, metadata)
SELECT 
    contributor1.id,
    'A journey of a thousand miles begins with a single step.',
    '/audio/sample2.mp3',
    4.1,
    'rejected',
    reviewer1.id,
    NOW() - INTERVAL '30 minutes',
    'poor',
    '{"deviceType": "mobile", "browserType": "safari"}'::jsonb
FROM contributor1, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'A journey of a thousand miles begins with a single step.'
);

WITH contributor2 AS (
    SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, quality, metadata)
SELECT 
    contributor2.id,
    'To be or not to be, that is the question.',
    '/audio/sample3.mp3',
    2.8,
    'pending',
    'good',
    '{"deviceType": "desktop", "browserType": "firefox"}'::jsonb
FROM contributor2
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'To be or not to be, that is the question.'
);

WITH contributor1 AS (
    SELECT id FROM users WHERE email = 'contributor@example.com' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, reviewed_by, reviewed_at, quality, metadata)
SELECT 
    contributor1.id,
    'The sun rises in the east and sets in the west.',
    '/audio/sample4.mp3',
    3.5,
    'approved',
    reviewer1.id,
    NOW() - INTERVAL '45 minutes',
    'good',
    '{"deviceType": "tablet", "browserType": "chrome"}'::jsonb
FROM contributor1, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'The sun rises in the east and sets in the west.'
);

WITH contributor2 AS (
    SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, reviewed_by, reviewed_at, quality, metadata)
SELECT 
    contributor2.id,
    'Practice makes perfect in all endeavors.',
    '/audio/sample5.mp3',
    2.9,
    'approved',
    reviewer1.id,
    NOW() - INTERVAL '20 minutes',
    'fair',
    '{"deviceType": "desktop", "browserType": "edge"}'::jsonb
FROM contributor2, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'Practice makes perfect in all endeavors.'
);

-- Insert sample reviews using proper foreign key relationships
WITH recording1 AS (
    SELECT id FROM recordings WHERE sentence = 'The quick brown fox jumps over the lazy dog.' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    recording1.id,
    reviewer1.id,
    'approved',
    'Clear pronunciation and good audio quality',
    95,
    15
FROM recording1, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    JOIN recordings rec ON r.recording_id = rec.id 
    WHERE rec.sentence = 'The quick brown fox jumps over the lazy dog.'
);

WITH recording2 AS (
    SELECT id FROM recordings WHERE sentence = 'A journey of a thousand miles begins with a single step.' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    recording2.id,
    reviewer1.id,
    'rejected',
    'Background noise and unclear pronunciation',
    88,
    22
FROM recording2, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    JOIN recordings rec ON r.recording_id = rec.id 
    WHERE rec.sentence = 'A journey of a thousand miles begins with a single step.'
);

WITH recording4 AS (
    SELECT id FROM recordings WHERE sentence = 'The sun rises in the east and sets in the west.' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    recording4.id,
    reviewer1.id,
    'approved',
    'Excellent quality recording',
    98,
    12
FROM recording4, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    JOIN recordings rec ON r.recording_id = rec.id 
    WHERE rec.sentence = 'The sun rises in the east and sets in the west.'
);

WITH recording5 AS (
    SELECT id FROM recordings WHERE sentence = 'Practice makes perfect in all endeavors.' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    recording5.id,
    reviewer1.id,
    'approved',
    'Good recording with minor background noise',
    85,
    18
FROM recording5, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    JOIN recordings rec ON r.recording_id = rec.id 
    WHERE rec.sentence = 'Practice makes perfect in all endeavors.'
);
