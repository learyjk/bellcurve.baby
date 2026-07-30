-- Migration: mark guesses as refunded when Stripe fires charge.refunded
-- Keeps the guess row for audit/history; payment_status flips to 'refunded'
-- so totals and rankings can exclude it.

CREATE OR REPLACE FUNCTION mark_guess_refunded(p_payment_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result guesses%ROWTYPE;
BEGIN
  UPDATE guesses
  SET payment_status = 'refunded'
  WHERE payment_id = p_payment_id
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No guess found for payment: %', p_payment_id;
  END IF;

  RETURN row_to_json(v_result);
END;
$$;

-- Anon role needs EXECUTE (the webhook uses the anon key)
GRANT EXECUTE ON FUNCTION mark_guess_refunded(text) TO anon;
GRANT EXECUTE ON FUNCTION mark_guess_refunded(text) TO authenticated;
