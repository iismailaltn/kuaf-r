-- Add photo2 and photo3 columns to session_operations table
ALTER TABLE session_operations ADD COLUMN photo2 VARCHAR(500) DEFAULT NULL;
ALTER TABLE session_operations ADD COLUMN photo3 VARCHAR(500) DEFAULT NULL;
