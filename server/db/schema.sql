-- ESL Pronunciation Coach — database schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS words (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  word          TEXT        UNIQUE NOT NULL,
  ipa           TEXT,
  level         TEXT        NOT NULL,
  source        TEXT        NOT NULL DEFAULT 'seed',
  reviewed      BOOLEAN     DEFAULT false,
  targets       TEXT[],
  phonemic      JSONB,
  syllabic      JSONB,
  accentual     JSONB,
  intonational  JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  word_id      UUID        REFERENCES words(id) ON DELETE CASCADE,
  transcript   TEXT,
  attempt_num  INT         NOT NULL,
  score        FLOAT,
  phonemes_hit JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS phoneme_scores (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         REFERENCES users(id) ON DELETE CASCADE,
  phoneme    VARCHAR(10)  NOT NULL,
  category   VARCHAR(20),
  dimension  VARCHAR(20)  NOT NULL,
  attempts   INT          DEFAULT 0,
  successes  INT          DEFAULT 0,
  recent     FLOAT[]      DEFAULT '{}',
  mastered   BOOLEAN      DEFAULT false,
  updated_at TIMESTAMPTZ  DEFAULT now(),
  UNIQUE(user_id, phoneme, dimension)
);

CREATE TABLE IF NOT EXISTS user_stats (
  id                UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID  UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  xp                INT   DEFAULT 0,
  level             INT   DEFAULT 1,
  streak            INT   DEFAULT 0,
  last_session_date DATE,
  total_phrases     INT   DEFAULT 0,
  badges            TEXT[] DEFAULT '{}'
);
