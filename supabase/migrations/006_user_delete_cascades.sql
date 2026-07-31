-- Fix auth user deletion 500s: public tables referenced auth.users with
-- default NO ACTION FKs, so Postgres rejected user deletes. Recreate FKs
-- with ON DELETE CASCADE (full chain: users -> pools -> guesses -> rankings).
-- NOTE: deleting a user now deletes their pools and all guesses on them.

-- user FKs
ALTER TABLE public.guesses DROP CONSTRAINT bets_user_id_fkey;
ALTER TABLE public.guesses ADD CONSTRAINT bets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.pools DROP CONSTRAINT pools_user_id_fkey;
ALTER TABLE public.pools ADD CONSTRAINT pools_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- pool -> guesses / rankings chain
ALTER TABLE public.guesses DROP CONSTRAINT bets_pool_id_fkey;
ALTER TABLE public.guesses ADD CONSTRAINT bets_pool_id_fkey
  FOREIGN KEY (pool_id) REFERENCES public.pools(id) ON DELETE CASCADE;

ALTER TABLE public.rankings DROP CONSTRAINT rankings_bet_id_fkey;
ALTER TABLE public.rankings ADD CONSTRAINT rankings_bet_id_fkey
  FOREIGN KEY (guess_id) REFERENCES public.guesses(id) ON DELETE CASCADE;

ALTER TABLE public.rankings DROP CONSTRAINT rankings_pool_id_fkey;
ALTER TABLE public.rankings ADD CONSTRAINT rankings_pool_id_fkey
  FOREIGN KEY (pool_id) REFERENCES public.pools(id) ON DELETE CASCADE;
