-- SAMPLE DATA FOR VOICE PLATFORM
-- Run this AFTER creating the tables above

-- Insert sample users
INSERT INTO users (email, password, role, status, profile_complete, name, is_active, location, employment_status, educational_background) VALUES
('admin@commonvoice.org', 'admin123', 'admin', 'active', true, 'System Admin', true, 'Nairobi', 'employed', 'postgraduate'),
('reviewer@example.com', 'reviewer123', 'reviewer', 'active', true, 'John Reviewer', true, 'Nakuru', 'employed', 'graduate'),
('contributor@example.com', 'contributor123', 'contributor', 'active', true, 'Jane Contributor', true, 'Kisumu', 'unemployed', 'secondary');

-- Insert sample sentences
INSERT INTO sentences (mozilla_id, text, language_code, source, version, is_validated, taxonomy, difficulty_level, word_count, character_count) VALUES
('curated_en_001', 'The quick brown fox jumps over the lazy dog.', 'en', 'curated', 1, true, '{"Licence": "Curated"}', 'basic', 9, 44),
('curated_en_002', 'A journey of a thousand miles begins with a single step.', 'en', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 10, 58),
('curated_en_003', 'Practice makes perfect in all endeavors.', 'en', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 6, 42),
('curated_luo_001', 'Onge ranyisi moro amora ma oseket e yor chik ma nyiso ni wachno en adier.', 'luo', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 15, 80),
('curated_luo_002', 'Chakruok e piny ni kaka gi chakruok e yor chik ma nyiso ni wachno en adier.', 'luo', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 15, 85);

-- Success message
SELECT 'Sample data inserted successfully! Ready for Voice Platform use.' as status;
