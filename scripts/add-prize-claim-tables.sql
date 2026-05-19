-- Create prize claims table to track user prize claims
CREATE TABLE IF NOT EXISTS prize_claims (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    inventory_id VARCHAR(255) NOT NULL,
    allocation_id VARCHAR(255),
    claim_type VARCHAR(50) NOT NULL, -- 'qr_scan', 'mystery_box', 'game_winner'
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_prize_claims_user_id ON prize_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_prize_claims_inventory_id ON prize_claims(inventory_id);

-- Display summary
SELECT 'prize_claims table created successfully' as status;

-- Made with Bob
