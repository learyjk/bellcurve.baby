# Test Data Cleanup

How to safely remove test users and pools while developing.

## Golden rule

**Never delete users from the Supabase dashboard during development.** The DB
cascade FKs (migration 006) will remove their pools/guesses/rankings, but any
real payments on those pools will NOT be refunded — the cascade doesn't touch
Stripe. Use the admin cleanup page instead; it refunds first.

## Admin cleanup page (preferred)

`/admin/cleanup` — visible only to emails in `ADMIN_EMAILS` (same gate as
`/admin/fees`).

- **Delete pool**: refunds every paid guess in Stripe
  (`refund_application_fee: true`, platform eats the processing fee — same
  policy as the organizer refund button), then deletes pool + guesses +
  rankings. If any refund fails, nothing is deleted.
- **Delete user**: refunds all paid guesses on their pools *and* their own
  paid guesses elsewhere, then deletes the auth account (pools/guesses/
  rankings cascade). Cannot delete your own account.

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (server-side only,
never `NEXT_PUBLIC_`). Get it from Supabase dashboard → Settings → API.

## Manual SQL (escape hatch)

If the app is down and you must clean up by hand, do it in this order:

```sql
-- 1. Find paid guesses that need manual Stripe refunds first
SELECT g.id, g.payment_id, g.calculated_price, p.slug
FROM public.guesses g
JOIN public.pools p ON p.id = g.pool_id
WHERE p.user_id = '<user_id>' AND g.payment_status = 'paid';
-- refund each payment_id in the Stripe dashboard

-- 2. Delete the user (cascades pools -> guesses -> rankings)
DELETE FROM auth.users WHERE id = '<user_id>';
```

## What's protected

- RLS (migration 007): pools/guesses/rankings are world-readable but
  writable only by the owner (pools) or SECURITY DEFINER webhook RPCs
  (guesses/rankings). No public DELETE policies — deletion only via the
  admin service-role flow.
- FK cascades (006): `auth.users → pools → guesses → rankings`, so no
  orphaned rows regardless of which entry point deletes.

## Stripe Connect leftovers

Deleting a pool/user does not delete their Stripe Connect test account. In
test mode that's fine; clean up occasionally in the Stripe dashboard →
Connect → Accounts.
