-- Add client_reply columns to contacts table (safe to run multiple times)
-- These columns are already included in schema.sql
-- Only run this if you have an existing contacts table without these columns

SET FOREIGN_KEY_CHECKS = 0;

-- Add columns only if they don't exist (MySQL 8.0+)
-- For older MySQL, these will error if columns already exist - that's OK
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS client_reply TEXT NULL,
ADD COLUMN IF NOT EXISTS client_replied_at TIMESTAMP NULL;

SET FOREIGN_KEY_CHECKS = 1;
