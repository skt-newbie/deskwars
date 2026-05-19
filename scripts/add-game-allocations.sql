-- Create game_allocations table
CREATE TABLE IF NOT EXISTS game_allocations (
    id VARCHAR(255) PRIMARY KEY,
    allocation_id VARCHAR(255) UNIQUE NOT NULL,
    game_code VARCHAR(50) NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    reward_type VARCHAR(255) NOT NULL,
    inventory_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

-- Insert game allocations
INSERT INTO game_allocations (id, allocation_id, game_code, game_name, category, reward_type, inventory_id) VALUES
-- Complete the Madness (FP)
(gen_random_uuid(), 'FP_01', 'FP', 'Complete the Madness', 'Main Winner', 'Gold', 'MND-015'),
(gen_random_uuid(), 'FP_02', 'FP', 'Complete the Madness', 'Main Winner', 'Silver', 'MND-008'),
(gen_random_uuid(), 'FP_03', 'FP', 'Complete the Madness', 'Main Winner', 'Bronze', 'MND-003'),

-- Desk Wars (CD)
(gen_random_uuid(), 'CD_01', 'CD', 'Desk Wars', 'Main Winner', 'Gold', 'MND-019'),
(gen_random_uuid(), 'CD_02', 'CD', 'Desk Wars', 'Main Winner', 'Silver', 'MND-002'),
(gen_random_uuid(), 'CD_03', 'CD', 'Desk Wars', 'Main Winner', 'Bronze', 'MND-059'),

-- Scan and Survive (QR)
(gen_random_uuid(), 'QR_01', 'QR', 'Scan and Survive', 'Main Prize QR', 'Winner', 'MND-020'),
(gen_random_uuid(), 'QR_02', 'QR', 'Scan and Survive', 'Main Prize QR', 'Winner', 'MND-023'),
(gen_random_uuid(), 'QR_03', 'QR', 'Scan and Survive', 'Main Prize QR', 'Winner', 'MND-021'),
(gen_random_uuid(), 'QR_04', 'QR', 'Scan and Survive', 'Small Reward QR', 'Winner', 'MND-009'),
(gen_random_uuid(), 'QR_05', 'QR', 'Scan and Survive', 'Small Reward QR', 'Winner', 'MND-005'),
(gen_random_uuid(), 'QR_06', 'QR', 'Scan and Survive', 'Small Reward QR', 'Winner', 'MND-007'),
(gen_random_uuid(), 'QR_07', 'QR', 'Scan and Survive', 'Small Reward QR', 'Winner', 'MND-024'),
(gen_random_uuid(), 'QR_08', 'QR', 'Scan and Survive', 'Small Reward QR', 'Winner', 'MND-017'),
(gen_random_uuid(), 'QR_09', 'QR', 'Scan and Survive', 'Dummy QR', 'Funny Reward', 'MND-029'),
(gen_random_uuid(), 'QR_10', 'QR', 'Scan and Survive', 'Dummy QR', 'Funny Reward', 'MND-030'),
(gen_random_uuid(), 'QR_11', 'QR', 'Scan and Survive', 'Dummy QR', 'Funny Reward', 'MND-031'),
(gen_random_uuid(), 'QR_12', 'QR', 'Scan and Survive', 'Dummy QR', 'Funny Reward', 'MND-032'),
(gen_random_uuid(), 'QR_13', 'QR', 'Scan and Survive', 'Dummy QR', 'Funny Reward', 'MND-034'),
(gen_random_uuid(), 'QR_14', 'QR', 'Scan and Survive', 'Dummy QR', 'Funny Reward', 'MND-035'),
(gen_random_uuid(), 'QR_15', 'QR', 'Scan and Survive', 'Chaos QR', 'Dummy Reward', 'MND-040'),

-- Mystery Gifts (MB)
(gen_random_uuid(), 'MB_01', 'MB', 'Mystery Gifts', 'Premium Box', 'Premium Reward', 'MND-014'),
(gen_random_uuid(), 'MB_02', 'MB', 'Mystery Gifts', 'Premium Box', 'Premium Reward', 'MND-016'),
(gen_random_uuid(), 'MB_03', 'MB', 'Mystery Gifts', 'Premium Box', 'Premium Reward', 'MND-012'),
(gen_random_uuid(), 'MB_04', 'MB', 'Mystery Gifts', 'Useful/Fun Gift', 'Useful Reward', 'MND-004'),
(gen_random_uuid(), 'MB_05', 'MB', 'Mystery Gifts', 'Useful/Fun Gift', 'Useful Reward', 'MND-013'),
(gen_random_uuid(), 'MB_06', 'MB', 'Mystery Gifts', 'Useful/Fun Gift', 'Useful Reward', 'MND-018'),
(gen_random_uuid(), 'MB_07', 'MB', 'Mystery Gifts', 'Funny/Dummy Box', 'Dummy Reward', 'MND-036'),
(gen_random_uuid(), 'MB_08', 'MB', 'Mystery Gifts', 'Funny/Dummy Box', 'Dummy Reward', 'MND-039'),
(gen_random_uuid(), 'MB_09', 'MB', 'Mystery Gifts', 'Funny/Dummy Box', 'Dummy Reward', 'MND-047'),
(gen_random_uuid(), 'MB_10', 'MB', 'Mystery Gifts', 'Funny/Dummy Box', 'Dummy Reward', 'MND-044');

-- Display summary
SELECT 
    game_code,
    game_name,
    COUNT(*) as allocation_count
FROM game_allocations
GROUP BY game_code, game_name
ORDER BY game_code;

-- Made with Bob
