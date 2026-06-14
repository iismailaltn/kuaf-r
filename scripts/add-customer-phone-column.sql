-- Add customer_phone column to session_operations table
ALTER TABLE session_operations ADD COLUMN customer_phone VARCHAR(20) DEFAULT NULL;
