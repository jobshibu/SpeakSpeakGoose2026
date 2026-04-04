-- Migration: game_state table for Goose Nest gamification
CREATE TABLE IF NOT EXISTS game_state (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  day               INT         DEFAULT 1,
  exp               BIGINT      DEFAULT 0,
  streak            INT         DEFAULT 0,
  last_practice_day INT         DEFAULT 0,
  creatures         JSONB       DEFAULT '[]',
  phrase_struggles  JSONB       DEFAULT '{}',
  animation_state   TEXT        DEFAULT 'idle',
  updated_at        TIMESTAMPTZ DEFAULT now()
);
