-- Row Level Security for public tables.
-- Until now access control lived only in app/server-action code; this locks
-- the tables down at the database layer. SECURITY DEFINER RPCs
-- (webhook-created guesses, refunds) bypass RLS and keep working.
--
-- Model:
--   pools:    world-readable; owner can insert/update; NO public delete
--             (deletion is admin-only via the service role + Stripe refunds)
--   guesses:  world-readable (public leaderboard); insert happens via the
--             SECURITY DEFINER create_guess_from_webhook RPC; no public
--             update/delete
--   rankings: world-readable; written by server code; no public write

ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

-- ---- pools ----
CREATE POLICY pools_select_all ON public.pools
  FOR SELECT USING (true);

CREATE POLICY pools_insert_owner ON public.pools
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pools_update_owner ON public.pools
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy: pool deletion goes through the admin flow (service
-- role), which refunds paid guesses in Stripe before removing rows.

-- ---- guesses ----
CREATE POLICY guesses_select_all ON public.guesses
  FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies for regular users. Inserts come from the
-- webhook RPC (security definer), status changes from mark_guess_refunded
-- (security definer), deletion cascades from pools/users.

-- ---- rankings ----
CREATE POLICY rankings_select_all ON public.rankings
  FOR SELECT USING (true);

-- No write policies: computed and maintained by server code only.
