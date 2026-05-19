-- Add new columns to qr_definitions table
ALTER TABLE qr_definitions ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE qr_definitions ADD COLUMN IF NOT EXISTS next_qr_id VARCHAR(255);
ALTER TABLE qr_definitions ADD COLUMN IF NOT EXISTS next_qr_location VARCHAR(255);

-- Clear existing QR definitions
DELETE FROM qr_definitions;

-- Insert updated QR definitions with riddles and clues
INSERT INTO qr_definitions (qr_id, location, riddle, answer, next_clue, next_qr_id, next_qr_location, guaranteed_prize_id) VALUES
('QR_001', 'Reception (6F)', 'I follow you everywhere, mimic your every move, yet vanish the moment darkness arrives. What am I?', 'shadow', 'Find the place where chairs disappear faster than snacks.', 'QR_011', 'Cafeteria', 'MND-020'),
('QR_002', 'Dustbin (6F)', 'I become larger every time something is taken away from me. What am I?', 'hole', 'Knowledge sleeps quietly here while deadlines scream outside.', 'QR_012', 'Library (6F)', 'MND-023'),
('QR_003', 'TV Area (5F)', 'The person who makes it has no use for it. The person who buys it never sees it. The person who uses it never knows it. What is it?', 'coffin', 'Find the place where forgotten office treasures vanish forever.', 'QR_008', '6th Floor Random Cupboards', 'MND-021'),
('QR_004', 'TV Area (6F)', 'I can fill a room without taking up any space. What am I?', 'light', 'Find the battlefield where caffeine defeats productivity.', 'QR_005', 'Vending Machine / Bookshelf (5F)', 'MND-009'),
('QR_005', 'Vending Machine / Bookshelf (5F)', 'I shave every day, but my beard stays the same. Who am I?', 'barber', 'Find the place people mysteriously disappear to during long calls.', 'QR_013', 'Outside — No Name Area', 'MND-005'),
('QR_006', 'Wall of Glory (5F)', 'I have cities but no houses, forests but no trees, and rivers but no water. What am I?', 'map', 'Find the place where people pretend standing improves productivity.', 'QR_014', 'Standing Desk #1', 'MND-007'),
('QR_007', 'Wall of Glory (6F)', 'Feed me and I live. Give me water and I die. What am I?', 'fire', 'Find the unofficial office sleeping headquarters.', 'QR_009', 'Washrooms Hidden Spot #1', 'MND-024'),
('QR_008', '6th Floor Random Cupboards', 'The more of me there is, the less you can see. What am I?', 'darkness', 'Find the glowing wall celebrating old victories.', 'QR_006', 'Wall of Glory (5F)', 'MND-017'),
('QR_009', 'Washrooms Hidden Spot #1', 'I''m always coming, but I never arrive. What am I?', 'tomorrow', 'Find the giant screen where meetings become background noise.', 'QR_003', 'TV Area (5F)', 'MND-029'),
('QR_010', 'Washrooms Hidden Spot #2', 'What can you hold in your left hand but never in your right?', 'your right elbow', 'Find the second standing kingdom of fake ergonomic discipline.', 'QR_015', 'Standing Desk #2', 'MND-030'),
('QR_011', 'Cafeteria', 'The more you leave behind, the more you take with you. What are they?', 'footsteps', 'Find the wall where office legends are permanently framed.', 'QR_007', 'Wall of Glory (6F)', 'MND-031'),
('QR_012', 'Library (6F)', 'I have branches, but no fruit, trunk, or leaves. What am I?', 'bank', 'Find the place that welcomes everyone before chaos starts daily.', 'QR_001', 'Reception (6F)', 'MND-032'),
('QR_013', 'Outside — No Name Area', 'What invention lets you look right through a wall?', 'window', 'Find the magical bin where failed printouts go to die.', 'QR_002', 'Dustbin (6F)', 'MND-034'),
('QR_014', 'Standing Desk #1', 'I have lakes with no water, mountains with no stone, and cities with no buildings. What am I?', 'map', 'Find the giant screen upstairs where cricket scores matter more than work.', 'QR_004', 'TV Area (6F)', 'MND-035'),
('QR_015', 'Standing Desk #2', 'What is seen in the middle of March and April that cannot be seen at the beginning or end of either month?', 'r', 'Find the hidden washroom escape route nobody admits using.', 'QR_010', 'Washrooms Hidden Spot #2', 'MND-040');

-- Display summary
SELECT 
    COUNT(*) as total_qr_codes,
    COUNT(DISTINCT location) as unique_locations
FROM qr_definitions;

SELECT qr_id, location, LEFT(riddle, 50) || '...' as riddle_preview
FROM qr_definitions
ORDER BY qr_id;

-- Made with Bob
