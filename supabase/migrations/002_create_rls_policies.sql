-- Enable RLS on all tables
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POOLS POLICIES
-- =============================================

-- Anyone can view pools (public visibility for sharing)
CREATE POLICY "Anyone can view pools" ON pools
  FOR SELECT USING (true);

-- Only pool creators can update their own pools
CREATE POLICY "Pool creators can update own pools" ON pools
  FOR UPDATE USING (auth.uid() = user_id);

-- Only pool creators can delete their own pools
CREATE POLICY "Pool creators can delete own pools" ON pools
  FOR DELETE USING (auth.uid() = user_id);

-- Authenticated users can create pools
CREATE POLICY "Authenticated users can create pools" ON pools
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- GUESSES POLICIES
-- =============================================

-- Users can view all guesses in pools they have access to
-- (since pools are public, all guesses are viewable)
CREATE POLICY "Anyone can view guesses" ON guesses
  FOR SELECT USING (true);

-- Users can only create guesses for themselves
CREATE POLICY "Users can create own guesses" ON guesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users cannot update guesses once created (paid guesses are immutable)
-- Only allow updates for unpaid guesses or in very specific circumstances
CREATE POLICY "Users can update unpaid guesses only" ON guesses
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND (payment_status IS NULL OR payment_status = 'pending')
    AND EXISTS (
      SELECT 1 FROM pools 
      WHERE pools.id = guesses.pool_id 
      AND (pools.is_locked IS FALSE OR pools.is_locked IS NULL)
    )
  );

-- Users cannot delete guesses once paid
-- Only allow deletion of unpaid guesses
CREATE POLICY "Users can delete unpaid guesses only" ON guesses
  FOR DELETE USING (
    auth.uid() = user_id 
    AND (payment_status IS NULL OR payment_status = 'pending')
    AND EXISTS (
      SELECT 1 FROM pools 
      WHERE pools.id = guesses.pool_id 
      AND (pools.is_locked IS FALSE OR pools.is_locked IS NULL)
    )
  );

-- Pool owners can delete any guess in their pools
-- But should be very careful with paid guesses (consider refund implications)
CREATE POLICY "Pool owners can delete guesses with caution" ON guesses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pools 
      WHERE pools.id = guesses.pool_id 
      AND pools.user_id = auth.uid()
    )
  );

-- Additional policy: Prevent updates to paid guesses via additional constraint
CREATE POLICY "Prevent modification of paid guesses" ON guesses
  FOR UPDATE USING (
    CASE 
      WHEN payment_status = 'completed' OR payment_status = 'succeeded' THEN false
      ELSE true
    END
  );

-- =============================================
-- RANKINGS POLICIES
-- =============================================

-- Anyone can view rankings (public leaderboards)
CREATE POLICY "Anyone can view rankings" ON rankings
  FOR SELECT USING (true);

-- Only pool owners can insert/update/delete rankings
-- (rankings are typically calculated and managed by the system/pool owner)
CREATE POLICY "Pool owners can manage rankings" ON rankings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pools 
      WHERE pools.id = rankings.pool_id 
      AND pools.user_id = auth.uid()
    )
  );

-- Allow system/admin to manage rankings via service role
-- (for automated ranking calculations)
CREATE POLICY "Service role can manage rankings" ON rankings
  FOR ALL USING (auth.role() = 'service_role');
