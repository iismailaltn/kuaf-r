-- Add pending_upgrade_request column to corporate_profiles table
ALTER TABLE corporate_profiles ADD COLUMN pending_upgrade_request INT DEFAULT 0;
