-- Migration: record whether each paid guess was a real (live) or sandbox
-- (test-mode) Stripe payment.
--
-- Dev and prod share this one Supabase DB but use different Stripe keys, and
-- Stripe payment ids share the pi_3... prefix, so the only reliable way to
-- tell them apart is the `livemode` flag present on the Stripe event/charge.
-- Capturing it at webhook time lets /admin/fees filter in SQL instead of
-- doing a Stripe API lookup per row.

ALTER TABLE guesses
  ADD COLUMN IF NOT EXISTS livemode boolean;

-- Backfill note: rows created before this column existed have livemode = NULL
-- ("unknown"). They can be backfilled from Stripe by payment_id; see the
-- /admin/fees page, which treats NULL as "unknown" mode.

-- Thread livemode through the guess-creation RPC so the webhook can record it.
CREATE OR REPLACE FUNCTION create_guess_from_webhook(
  p_pool_id        uuid,
  p_user_id        uuid,
  p_guessed_birth_date date,
  p_guessed_weight numeric,
  p_calculated_price numeric,
  p_payment_id     text,
  p_name           text,
  p_is_anonymous   boolean,
  p_livemode       boolean DEFAULT NULL
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
    calculated_price, payment_id, payment_status, name, is_anonymous,
    livemode
  )
  VALUES (
    p_pool_id, p_user_id, p_guessed_birth_date, p_guessed_weight,
    p_calculated_price, p_payment_id, 'paid', p_name, p_is_anonymous,
    p_livemode
  )
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

-- Match the original migration's grants (anon/authenticated only).
REVOKE ALL ON FUNCTION create_guess_from_webhook(
  uuid, uuid, date, numeric, numeric, text, text, boolean, boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_guess_from_webhook(
  uuid, uuid, date, numeric, numeric, text, text, boolean, boolean
) TO anon, authenticated;
