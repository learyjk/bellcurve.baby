-- Migration: Add Stripe Connect Express fields to pools
-- Run this in Supabase SQL Editor

ALTER TABLE pools
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for webhook lookups (account.updated fires with account id)
CREATE INDEX IF NOT EXISTS pools_stripe_account_id_idx ON pools (stripe_account_id);

-- Open pool creation to all authenticated users automatically
-- by auto-granting the feature flag on signup.
-- This replaces the manual admin grant flow.
CREATE OR REPLACE FUNCTION grant_create_pool_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_features (user_id, feature)
  VALUES (NEW.id, 'create_baby_pool')
  ON CONFLICT (user_id, feature) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists before re-creating
DROP TRIGGER IF EXISTS auto_grant_create_pool ON auth.users;

CREATE TRIGGER auto_grant_create_pool
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION grant_create_pool_on_signup();

-- Backfill: grant existing users the feature so they aren't locked out
INSERT INTO user_features (user_id, feature)
SELECT id, 'create_baby_pool'
FROM auth.users
ON CONFLICT (user_id, feature) DO NOTHING;
