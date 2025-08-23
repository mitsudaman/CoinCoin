-- CoinCoin Database Schema

-- Players table to store game data
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  coins BIGINT DEFAULT 0 NOT NULL,
  buildings JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (for technical challenge)
CREATE POLICY "Allow all operations on players" ON players
FOR ALL USING (true) WITH CHECK (true);

-- Index for better performance
CREATE INDEX players_username_idx ON players(username);
CREATE INDEX players_coins_idx ON players(coins DESC);
CREATE INDEX players_updated_at_idx ON players(updated_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on every update
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO players (username, coins, buildings) VALUES 
-- ('TestPlayer1', 1000, '{"coin_maker": 2, "gold_mine": 1}'),
-- ('TestPlayer2', 500, '{"coin_maker": 1}');