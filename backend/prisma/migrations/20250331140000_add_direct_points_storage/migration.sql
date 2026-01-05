-- Add points columns to teams table
ALTER TABLE teams
  ADD COLUMN zone_points DOUBLE PRECISION DEFAULT 0 NOT NULL,
  ADD COLUMN band_points INTEGER DEFAULT 0 NOT NULL;

-- Create zone_occupations table
CREATE TABLE zone_occupations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  zone_id TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  entered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT zone_occupations_zone_id_team_id_key UNIQUE(zone_id, team_id)
);

CREATE INDEX idx_zone_occupations_team_id ON zone_occupations(team_id);
CREATE INDEX idx_zone_occupations_zone_id ON zone_occupations(zone_id);

-- Remove old pause fields from games
ALTER TABLE games DROP COLUMN IF EXISTS paused_elapsed_seconds;
ALTER TABLE games DROP COLUMN IF EXISTS total_paused_seconds;
