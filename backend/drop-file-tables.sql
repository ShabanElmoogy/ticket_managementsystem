-- Drop file management related tables
-- Run this SQL script to remove file management tables from your database

-- Drop foreign key constraints first
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS notifications_fileId_fkey;
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS notifications_versionId_fkey;

-- Drop the tables
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS file_uploads;
DROP TABLE IF EXISTS app_versions;

-- Remove file management columns from users table if they exist
ALTER TABLE users DROP COLUMN IF EXISTS uploadedVersions;
ALTER TABLE users DROP COLUMN IF EXISTS uploadedFiles;

-- Clean up any remaining references
-- Note: This script assumes standard foreign key naming conventions
-- You may need to adjust based on your actual database structure

SHOW TABLES;