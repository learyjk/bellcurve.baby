-- Allow 'refunded' as a payment_status (constraint predates refund support)
ALTER TABLE guesses DROP CONSTRAINT bets_payment_status_check;
ALTER TABLE guesses ADD CONSTRAINT bets_payment_status_check
  CHECK (payment_status = ANY (ARRAY['unpaid', 'pending', 'paid', 'refunded']));
