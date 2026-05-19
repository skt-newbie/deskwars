-- ============================================
-- Deskwars Platform Database Initialization
-- Complete SQL script for PostgreSQL
-- ============================================

-- Drop existing tables (if needed for fresh start)
-- Uncomment the following lines if you want to reset everything
-- DROP TABLE IF EXISTS prize_claims CASCADE;
-- DROP TABLE IF EXISTS game_allocations CASCADE;
-- DROP TABLE IF EXISTS inventory CASCADE;
-- DROP TABLE IF EXISTS qr_riddle_attempts CASCADE;
-- DROP TABLE IF EXISTS qr_definitions CASCADE;
-- DROP TABLE IF EXISTS future_qr_scans CASCADE;
-- DROP TABLE IF EXISTS submissions CASCADE;
-- DROP TABLE IF EXISTS tick_boom_sessions CASCADE;
-- DROP TABLE IF EXISTS user_mystery_claims CASCADE;
-- DROP TABLE IF EXISTS mystery_nodes CASCADE;
-- DROP TABLE IF EXISTS game_configs CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. USERS TABLE
-- Stores all user accounts and their points
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    total_points INTEGER DEFAULT 0 NOT NULL,
    desk_points INTEGER DEFAULT 0 NOT NULL,
    drawing_points INTEGER DEFAULT 0 NOT NULL,
    qr_hunt_step INTEGER DEFAULT 1 NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);

-- ============================================
-- 2. GAME CONFIGS TABLE
-- Controls which games are enabled/disabled
-- ============================================
CREATE TABLE IF NOT EXISTS game_configs (
    game_id VARCHAR(255) PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL
);

-- Initialize game configurations
INSERT INTO game_configs (game_id, is_enabled) VALUES
    ('desk-wars', TRUE),
    ('hidden-chaos', TRUE),
    ('tick-tick-boom', TRUE)
ON CONFLICT (game_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- ============================================
-- 3. INVENTORY TABLE
-- Stores all physical prizes and their quantities
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL,
    digital_fallback_points INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);

-- Initialize inventory items
INSERT INTO inventory (id, name, quantity, digital_fallback_points) VALUES
    ('MND-001', 'Ant Esports Wolf Mouse Pad', 1, 104),
    ('MND-002', 'Portronics Toad 8 Transparent Wireless Bluetooth Mouse', 1, 612),
    ('MND-003', 'Tygot Bluetooth Selfie Stick Tripod', 0, 256),
    ('MND-004', 'Portronics Toad 23 Wireless Mouse', 0, 269),
    ('MND-005', 'Portronics Swipe 2 Screen Cleaner', 0, 119),
    ('MND-006', 'Portronics Bubble 3.0 Wireless Keyboard', 1, 899),
    ('MND-010', 'Zebronics Transformer Gaming Mouse', 1, 549),
    ('MND-012', 'Portronics Toad 23 Wireless Mouse (Blue)', 1, 269),
    ('MND-013', 'Ambrane 60W Type-C Cable', 1, 141),
    ('MND-014', 'Portronics Toad 8 Mouse (Black)', 1, 612),
    ('MND-016', 'Portronics Toad 8 Mouse (White)', 1, 612),
    ('MND-018', 'Blaze Storm Soft Bullet Gun Toy', 1, 174),
    ('MND-022', 'Fitness Mantra Sports Socks', 12, 16),
    ('MND-024', 'Gizga Pro 3-in-1 Cleaning Kit', 2, 125),
    ('MND-026', 'Billebon Premium Neck Pillow (Black)', 3, 223),
    ('MND-027', 'Iris Lavender Fragrance Ceramic Vaporizer Set', 3, 249),
    ('MND-028', 'EKAM Reed Diffuser Gift Set', 3, 249),
    ('MND-036', 'Cheetos Masala Balls', 1, 31),
    ('MND-039', 'Lay''s Magic Masala Chips', 1, 36),
    ('MND-044', 'Act II Classic Salted Popcorn', 1, 10),
    ('MND-047', 'Ant Esports GP300 Gaming Controller', 1, 1329),
    ('MND-049', 'DesiDiya Universe Crystal Ball LED Lamp', 3, 179),
    ('MND-054', 'Quace Crystal Rain Drop String Light', 1, 199),
    ('MND-057', 'Oral-B Pro Clean Sensitive Toothbrush', 6, 50)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    quantity = EXCLUDED.quantity,
    digital_fallback_points = EXCLUDED.digital_fallback_points;

-- ============================================
-- 4. GAME ALLOCATIONS TABLE
-- Maps prizes to specific games and allocation IDs
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_game_allocations_game_code ON game_allocations(game_code);
CREATE INDEX IF NOT EXISTS idx_game_allocations_allocation_id ON game_allocations(allocation_id);

-- Initialize game allocations
INSERT INTO game_allocations (id, allocation_id, game_code, game_name, category, reward_type, inventory_id) VALUES
    -- Complete the Madness (FP) - 3 prizes
    (gen_random_uuid(), 'FP_01', 'FP', 'Complete the Madness', 'Premium Prize', 'Premium Reward', 'MND-047'),
    (gen_random_uuid(), 'FP_02', 'FP', 'Complete the Madness', 'Premium Prize', 'Premium Reward', 'MND-002'),
    (gen_random_uuid(), 'FP_03', 'FP', 'Complete the Madness', 'Premium Prize', 'Premium Reward', 'MND-006'),
    
    -- Desk Wars (CD) - 3 prizes
    (gen_random_uuid(), 'CD_01', 'CD', 'Desk Wars', 'Premium Prize', 'Premium Reward', 'MND-014'),
    (gen_random_uuid(), 'CD_02', 'CD', 'Desk Wars', 'Premium Prize', 'Premium Reward', 'MND-016'),
    (gen_random_uuid(), 'CD_03', 'CD', 'Desk Wars', 'Premium Prize', 'Premium Reward', 'MND-010'),
    
    -- QR Hunt (QR) - 15 prizes
    (gen_random_uuid(), 'QR_01', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-012'),
    (gen_random_uuid(), 'QR_02', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-013'),
    (gen_random_uuid(), 'QR_03', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-018'),
    (gen_random_uuid(), 'QR_04', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-001'),
    (gen_random_uuid(), 'QR_05', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-054'),
    (gen_random_uuid(), 'QR_06', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-049'),
    (gen_random_uuid(), 'QR_07', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-049'),
    (gen_random_uuid(), 'QR_08', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-049'),
    (gen_random_uuid(), 'QR_09', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-028'),
    (gen_random_uuid(), 'QR_10', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-028'),
    (gen_random_uuid(), 'QR_11', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-028'),
    (gen_random_uuid(), 'QR_12', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-027'),
    (gen_random_uuid(), 'QR_13', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-027'),
    (gen_random_uuid(), 'QR_14', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-027'),
    (gen_random_uuid(), 'QR_15', 'QR', 'Scan and Survive', 'QR Hunt Prize', 'Hunt Reward', 'MND-026'),
    
    -- Mystery Gifts (MG) - 10 prizes
    (gen_random_uuid(), 'MG_01', 'MG', 'Mystery Gifts', 'Premium Box', 'Premium Reward', 'MND-014'),
    (gen_random_uuid(), 'MG_02', 'MG', 'Mystery Gifts', 'Premium Box', 'Premium Reward', 'MND-016'),
    (gen_random_uuid(), 'MG_03', 'MG', 'Mystery Gifts', 'Premium Box', 'Premium Reward', 'MND-012'),
    (gen_random_uuid(), 'MG_04', 'MG', 'Mystery Gifts', 'Useful/Fun Gift', 'Useful Reward', 'MND-004'),
    (gen_random_uuid(), 'MG_05', 'MG', 'Mystery Gifts', 'Useful/Fun Gift', 'Useful Reward', 'MND-013'),
    (gen_random_uuid(), 'MG_06', 'MG', 'Mystery Gifts', 'Useful/Fun Gift', 'Useful Reward', 'MND-018'),
    (gen_random_uuid(), 'MG_07', 'MG', 'Mystery Gifts', 'Funny/Dummy Box', 'Dummy Reward', 'MND-036'),
    (gen_random_uuid(), 'MG_08', 'MG', 'Mystery Gifts', 'Funny/Dummy Box', 'Dummy Reward', 'MND-039'),
    (gen_random_uuid(), 'MG_09', 'MG', 'Mystery Gifts', 'Funny/Dummy Box', 'Dummy Reward', 'MND-047'),
    (gen_random_uuid(), 'MG_10', 'MG', 'Mystery Gifts', 'Funny/Dummy Box', 'Dummy Reward', 'MND-044')
ON CONFLICT (allocation_id) DO UPDATE SET
    game_code = EXCLUDED.game_code,
    game_name = EXCLUDED.game_name,
    category = EXCLUDED.category,
    reward_type = EXCLUDED.reward_type,
    inventory_id = EXCLUDED.inventory_id;

-- ============================================
-- 5. QR DEFINITIONS TABLE
-- Stores QR Hunt riddles, answers, and clues
-- ============================================
CREATE TABLE IF NOT EXISTS qr_definitions (
    qr_id VARCHAR(255) PRIMARY KEY,
    location VARCHAR(500) NOT NULL,
    riddle TEXT NOT NULL,
    answer VARCHAR(255) NOT NULL,
    next_clue TEXT NOT NULL,
    next_qr_id VARCHAR(255),
    next_qr_location VARCHAR(500),
    guaranteed_prize_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_qr_definitions_qr_id ON qr_definitions(qr_id);

-- Initialize QR Hunt riddles
INSERT INTO qr_definitions (qr_id, location, riddle, answer, next_clue, next_qr_id, next_qr_location, guaranteed_prize_id) VALUES
    ('QRP_01', 'Reception (6F)', 'I follow you everywhere, mimic your every move, yet vanish the moment darkness arrives. What am I?', 'shadow', 'Find the place where chairs disappear faster than snacks.', 'QRP_11', 'Cafeteria', 'QR_01'),
    ('QRP_02', 'Dustbin (6F)', 'I become larger every time something is taken away from me. What am I?', 'hole', 'A kingdom where every shelf hides a new world.', 'QRP_12', 'Library (6F)', 'QR_02'),
    ('QRP_03', 'TV Area (5F)', 'The person who makes it has no use for it. The person who buys it never sees it. The person who uses it never knows it. What is it?', 'coffin', 'Dad''s favorite sleeping spot isn''t the destination — look beside it, behind closed doors.', 'QRP_08', '6th Floor Random Cupboards', 'QR_03'),
    ('QRP_04', 'TV Area (6F)', 'I can fill a room without taking up any space. What am I?', 'light', 'Where people pause for chips but ignore the wisdom beside them.', 'QRP_05', 'Vending Machine / Bookshelf (5F)', 'QR_04'),
    ('QRP_05', 'Vending Machine / Bookshelf (5F)', 'I shave every day, but my beard stays the same. Who am I?', 'barber', 'The answer lies where introductions are unnecessary.', 'QRP_13', 'Outside — No Name Area', 'QR_05'),
    ('QRP_06', 'Wall of Glory (5F)', 'I have cities but no houses, forests but no trees, and rivers but no water. What am I?', 'map', 'Not every work can happen sitting still.', 'QRP_14', 'Standing Desk #1', 'QR_06'),
    ('QRP_07', 'Wall of Glory (6F)', 'Feed me and I live. Give me water and I die. What am I?', 'fire', 'Even the greatest hunts require a quick pit stop.', 'QRP_09', 'Washrooms Hidden Spot #1', 'QR_07'),
    ('QRP_08', '6th Floor Random Cupboards', 'The more of me there is, the less you can see. What am I?', 'darkness', 'Descend a floor and faces of the past may guide you forward.', 'QRP_06', 'Wall of Glory (5F)', 'QR_08'),
    ('QRP_09', 'Washrooms Hidden Spot #1', 'I''m always coming, but I never arrive. What am I?', 'tomorrow', 'Go low to get to the couch potato command center.', 'QRP_03', 'TV Area (5F)', 'QR_09'),
    ('QRP_10', 'Washrooms Hidden Spot #2', 'What can you hold in your left hand but never in your right?', 'your right elbow', 'The next clue isn''t sitting around.', 'QRP_15', 'Standing Desk #2', 'QR_10'),
    ('QRP_11', 'Cafeteria', 'The more you leave behind, the more you take with you. What are they?', 'footsteps', 'The answer waits where moments refuse to fade.', 'QRP_07', 'Wall of Glory (6F)', 'QR_11'),
    ('QRP_12', 'Library (6F)', 'I have branches, but no fruit, trunk, or leaves. What am I?', 'bank', 'Go where forgotten IDs become daily drama.', 'QRP_01', 'Reception (6F)', 'QR_12'),
    ('QRP_13', 'Outside — No Name Area', 'What invention lets you look right through a wall?', 'window', 'What''s discarded may still hold meaning.', 'QRP_02', 'Dustbin (6F)', 'QR_13'),
    ('QRP_14', 'Standing Desk #1', 'I have lakes with no water, mountains with no stone, and cities with no buildings. What am I?', 'map', 'Another window into fantasy hides your next answer nearby.', 'QRP_04', 'TV Area (6F)', 'QR_14'),
    ('QRP_15', 'Standing Desk #2', 'What is seen in the middle of March and April that cannot be seen at the beginning or end of either month?', 'r', 'Run like a sprinter, sit like a monk, walk back like a king from the kingdom of porcelain thrones.', 'QRP_10', 'Washrooms Hidden Spot #2', 'QR_15')
ON CONFLICT (qr_id) DO UPDATE SET
    location = EXCLUDED.location,
    riddle = EXCLUDED.riddle,
    answer = EXCLUDED.answer,
    next_clue = EXCLUDED.next_clue,
    next_qr_id = EXCLUDED.next_qr_id,
    next_qr_location = EXCLUDED.next_qr_location,
    guaranteed_prize_id = EXCLUDED.guaranteed_prize_id;

-- ============================================
-- 6. USER DATA TABLES
-- Tables that store user activity and claims
-- ============================================

-- Submissions table (Desk Wars and Hidden Chaos)
CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    overall_score INTEGER,
    ai_comment TEXT,
    categories_json TEXT,
    ai_type VARCHAR(50) DEFAULT 'desk' NOT NULL,
    submission_mode VARCHAR(50) DEFAULT 'final' NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_ai_type ON submissions(ai_type);

-- QR Scans table (legacy/future use)
CREATE TABLE IF NOT EXISTS future_qr_scans (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    qr_id VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    prize_claimed VARCHAR(255),
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_qr_scans_user_id ON future_qr_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_id ON future_qr_scans(qr_id);

-- QR Riddle Attempts table (tracks user progress in QR Hunt)
CREATE TABLE IF NOT EXISTS qr_riddle_attempts (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    qr_id VARCHAR(255) NOT NULL,
    attempts INTEGER DEFAULT 0 NOT NULL,
    is_solved BOOLEAN DEFAULT FALSE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_qr_riddle_attempts_user_id ON qr_riddle_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_riddle_attempts_qr_id ON qr_riddle_attempts(qr_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_riddle_attempts_user_qr ON qr_riddle_attempts(user_id, qr_id);

-- Prize Claims table (tracks all prize claims)
CREATE TABLE IF NOT EXISTS prize_claims (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    inventory_id VARCHAR(255) NOT NULL,
    allocation_id VARCHAR(255),
    claim_type VARCHAR(100) NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prize_claims_user_id ON prize_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_prize_claims_inventory_id ON prize_claims(inventory_id);
CREATE INDEX IF NOT EXISTS idx_prize_claims_claimed_at ON prize_claims(claimed_at DESC);
CREATE INDEX IF NOT EXISTS idx_prize_claims_claim_type ON prize_claims(claim_type);

-- Mystery Nodes table (Hidden Chaos game)
CREATE TABLE IF NOT EXISTS mystery_nodes (
    id VARCHAR(255) PRIMARY KEY,
    points INTEGER NOT NULL,
    reward_text TEXT NOT NULL
);

-- User Mystery Claims table (tracks Hidden Chaos claims)
CREATE TABLE IF NOT EXISTS user_mystery_claims (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_mystery_claims_user_id ON user_mystery_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mystery_claims_node_id ON user_mystery_claims(node_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_mystery_claims_user_node ON user_mystery_claims(user_id, node_id);

-- Tick Boom Sessions table (Tick Tick Boom game)
CREATE TABLE IF NOT EXISTS tick_boom_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    attempts INTEGER DEFAULT 0 NOT NULL,
    last_played TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tick_boom_sessions_user_id ON tick_boom_sessions(user_id);

-- ============================================
-- SUMMARY QUERIES
-- ============================================

-- Display initialization summary
SELECT 'Database Initialization Complete!' AS status;

SELECT 
    'Game Configs' AS table_name,
    COUNT(*) AS record_count
FROM game_configs
UNION ALL
SELECT 
    'Inventory Items' AS table_name,
    COUNT(*) AS record_count
FROM inventory
UNION ALL
SELECT 
    'Game Allocations' AS table_name,
    COUNT(*) AS record_count
FROM game_allocations
UNION ALL
SELECT 
    'QR Definitions' AS table_name,
    COUNT(*) AS record_count
FROM qr_definitions;

-- Display inventory summary
SELECT 
    COUNT(*) AS total_items,
    SUM(quantity) AS total_quantity,
    SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) AS items_in_stock
FROM inventory;

-- Display game allocations by game
SELECT 
    game_code,
    game_name,
    COUNT(*) AS prize_count
FROM game_allocations
GROUP BY game_code, game_name
ORDER BY game_code;

-- ============================================
-- END OF INITIALIZATION SCRIPT
-- ============================================

-- Made with Bob
