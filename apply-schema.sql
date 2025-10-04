-- Apply the new schema from new_sql.md
-- This script will update the database to match the new schema

-- First, let's check if the tables exist and what columns they have
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'portal' 
AND table_name = 'portal_import_posts'
ORDER BY ordinal_position;

-- Check if the portal schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'portal';

-- Check if the portal_import_posts table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'portal' AND table_name = 'portal_import_posts';
