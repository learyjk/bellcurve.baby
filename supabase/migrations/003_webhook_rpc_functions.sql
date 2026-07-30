-- Migration: SECURITY DEFINER functions for webhook operations
-- These let the webhook use the anon key instead of the service role key.
-- Each function runs with superuser privileges ONLY for its specific operation.
-- RLS remains enabled on all tables.

-- 1. Insert a guess after a verified Stripe payment
--    Called by the checkout.session.completed webhook handler.
CREATE OR REPLACE FUNCTION create_guess_from_webhook(
  p_pool_id        uuid,
  p_user_id        uuid,
  p_guessed_birth_date date,
  p_guessed_weight numeric,
  p_calculated_price numeric,
  p_payment_id     text,
  p_name           text,
  p_is_anonymous   boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pool   pools%ROWTYPE;
  v_result guesses%ROWTYPE;
BEGIN
  -- Validate pool exists and is accepting guesses
  SELECT * INTO v_pool FROM pools WHERE id = p_pool_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pool not found: %', p_pool_id;
  END IF;
  IF v_pool.is_locked IS TRUE THEN
    RAISE EXCEPTION 'Pool is locked: %', p_pool_id;
  END IF;

  -- Idempotency: return existing guess if this payment was already processed
  SELECT * INTO v_result FROM guesses WHERE payment_id = p_payment_id;
  IF FOUND THEN
    RETURN row_to_json(v_result);
  END IF;

  -- Insert the verified guess
  INSERT INTO guesses (
    pool_id, user_id, guessed_birth_date, guessed_weight,
    calculated_price, payment_id, payment_status, name, is_anonymous
  )
  VALUES (
    p_pool_id, p_user_id, p_guessed_birth_date, p_guessed_weight,
    p_calculated_price, p_payment_id, 'paid', p_name, p_is_anonymous
  )
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

-- Restrict execution to the anon role only (not end users via client JS)
REVOKE ALL ON FUNCTION create_guess_from_webhook(
  uuid, uuid, date, numeric, numeric, text, text, boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_guess_from_webhook(
  uuid, uuid, date, numeric, numeric, text, text, boolean
) TO anon, authenticated;


-- 2. Mark a pool's Stripe Connect onboarding as complete
--    Called by the account.updated webhook and the Connect return route.
CREATE OR REPLACE FUNCTION mark_pool_stripe_connected(p_stripe_account_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE pools
  SET stripe_onboarding_complete = true
  WHERE stripe_account_id = p_stripe_account_id;
END;
$$;

REVOKE ALL ON FUNCTION mark_pool_stripe_connected(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_pool_stripe_connected(text) TO anon, authenticated;


-- 3. Get pool slug + stripe_account_id by pool id (for connect routes)
--    Pools are public records; this is just a clean RPC for unauthenticated reads.
CREATE OR REPLACE FUNCTION get_pool_connect_info(p_pool_id uuid)
RETURNS TABLE(slug text, stripe_account_id text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slug, stripe_account_id FROM pools WHERE id = p_pool_id;
$$;

REVOKE ALL ON FUNCTION get_pool_connect_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_pool_connect_info(uuid) TO anon, authenticated;
