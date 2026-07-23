-- Quanto Migration 010: asset_contributions lot quantity support
ALTER TABLE asset_contributions ADD COLUMN qty REAL CHECK (qty IS NULL OR qty > 0);
