-- Migration: Remove the user_features feature-flag system
-- Run this in Supabase SQL Editor
--
-- Pool creation is open to all authenticated users, so every row in
-- user_features was the same auto-granted 'create_baby_pool' flag.
-- The app no longer reads this table.

DROP TRIGGER IF EXISTS auto_grant_create_pool ON auth.users;
DROP FUNCTION IF EXISTS grant_create_pool_on_signup();
DROP TABLE IF EXISTS user_features;
