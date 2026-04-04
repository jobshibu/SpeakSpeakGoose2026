-- Migration: add type column to words table
ALTER TABLE words ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'word';
