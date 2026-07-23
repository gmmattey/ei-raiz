-- Quanto Migration 007: display_name on assets (Smart Labels)
ALTER TABLE assets ADD COLUMN display_name TEXT;
