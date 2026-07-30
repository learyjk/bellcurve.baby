# Testing Guide — bellcurve.baby

How to verify the app is ready for friends to use. Three layers:

1. [Automated tests](#automated-tests) — run first, fast
2. [Keegan's manual pass](#keegans-manual-pass) — ~20 min, covers Stripe money flow
3. [Wife's test script](#wifes-test-script) — ~10 min, fresh-eyes UX pass

The dev site is at **https://bellcurve-baby.exe.xyz**. Stripe is in **test mode** — use test cards, never real ones.

---

## Automated tests

```bash
# Unit tests (pricing curve, winner ranking, slugs, video embeds, dates)
npm test

# One-shot smoke test against a running server (default: the exe.xyz URL)
./scripts/smoke-test.sh
BASE_URL=http://localhost:8000 ./scripts/smoke-test.sh

# Type safety + lint before shipping
npx tsc --noEmit
npm run lint
```

| Suite | What it protects |
|---|---|
| `tests/pricing.test.ts` | Perfect guess = ceiling price, bound guess = floor price, curve symmetry, lbs↔oz conversion, aggressive vs chill ordering |
| `tests/ranking.test.ts` | Winner selection: euclidean distance over days-off + weight-off, tie handling, sort stability |
| `tests/slug.test.ts` | Pool URL slugs stay clean; suggestions are unique and valid |
| `tests/videoEmbed.test.ts` | Only YouTube/Vimeo embeds render; `javascript:` URLs etc. can never become iframes |
| `tests/date.test.ts` | Timezone-safe date math (a guess of "March 15" means March 15 everywhere) |
| `scripts/smoke-test.sh` | Live server sanity: key pages return 200, APIs don't 500, webhook rejects GET, unknown pools 404 |

**When to run:** unit tests + smoke test after every deploy or config change;
`tsc` + lint before merging anything.

---

## Keegan's manual pass

Do this in order — each step builds on the last. ~20 minutes. Keep
`docs/stripe-connect-testing.md` handy; it has the deep dive.

### 0. Prep (1 min)
- [ ] Dev server is running and reachable at https://bellcurve-baby.exe.xyz
- [ ] Stripe webhook listener is running (`stripe listen --forward-to ...`) —
      check the `webhook` tmux session, or restart per the Stripe guide
- [ ] Run the automated tests above; all green

### 1. Auth (3 min)
- [ ] Sign up with a **new test email** → confirmation email arrives → confirm →
      land back on the site logged in
- [ ] Log out, log back in
- [ ] "Forgot password" sends a reset email and the link works

### 2. Create a pool (5 min)
- [ ] `/baby/create` — create a pool named something like "Test Baby Q"
- [ ] Try to grab the same slug again → slug check says it's taken, suggestions offered
- [ ] Paste a YouTube link for the announcement video → it embeds on the pool page
- [ ] Paste garbage (`https://evil.com`) as the video → no iframe renders
- [ ] After creation you're sent to `/baby/<slug>/connect`

### 3. Connect Stripe (5 min)
- [ ] Click **Connect with Stripe** → Stripe hosted onboarding opens
- [ ] Test values: phone any format + code `000-000`, SSN `0000`,
      routing `110000000`, account `000123456789`
- [ ] Finish → redirected back with the 🎉 toast; yellow banner is gone
- [ ] **Bail-out case:** on a second pool, close onboarding mid-way → you land on
      `?status=refresh` with a **Resume** button that works

### 4. Place a guess (5 min) — use an incognito window as a second user
- [ ] Sign up as a brand-new user, open the pool, drag the sliders
- [ ] Price updates live and is between the pool's floor and ceiling
- [ ] **Place Guess** → Stripe Checkout → card `4242 4242 4242 4242`, any date/CVV
- [ ] Redirected back with "Payment successful" toast
- [ ] Your guess appears in the pool's guesses table
- [ ] `/guesses` shows it under "My guesses"
- [ ] **Unconnected pool case:** try to guess on the pool from step 3 that never
      finished onboarding → error toast, no Stripe redirect
- [ ] **Money check:** Stripe Dashboard → test mode → Connect → accounts → the
      test account shows the payment

### 5. Close the pool (2 min)
- [ ] As the creator: `/baby/<slug>/close` → enter an actual birth date + weight
- [ ] Rankings compute; the person closest wins
- [ ] Pool page now shows the locked/winner display
- [ ] New guesses are blocked on a closed pool

---

## Wife's test script

Send her this as-is. No Stripe knowledge needed — the card number is fake.
~10 minutes. Her job is to be a **normal person**, not a QA engineer.

> **Hey! Can you test my baby-pool app? Takes ~10 min.**
>
> 1. Open **https://bellcurve-baby.exe.xyz** on your phone (or laptop)
> 2. Sign up with your email (check spam for the confirmation link)
> 3. Create a pool for a fake baby — make up any name and due date.
>    When it asks you to "Connect Stripe", click it and fill everything in with
>    obvious fake info (Stripe is in test mode):
>    - verification code: **000-000**
>    - SSN last 4: **0000**
>    - routing number: **110000000**, account number: **000123456789**
> 4. Text me the link to your pool.
> 5. Then open **my** pool link (I'll text it to you), move the sliders to pick
>    a birthday and weight, and tap "Place Guess". At checkout use card
>    **4242 4242 4242 4242**, any future expiry, any 3-digit code, any ZIP.
> 6. Poke around: does the guesses list show your guess? Does everything look
>    right on your phone?
>
> **Tell me:** anything confusing, ugly, broken, or that made you hesitate.
> Screenshots of anything weird. That's it!

What to watch for on your side while she does this:

- [ ] She gets through signup without asking you questions
- [ ] Stripe onboarding completes (dashboard shows her test account)
- [ ] Her payment appears in the guesses table within seconds (webhook works)
- [ ] Every point where she hesitates = a UX bug to write down

---

## Before real friends use it

- [ ] All automated tests green
- [ ] Keegan's manual pass green on the exact URL friends will use
- [ ] Stripe Dashboard (test mode) shows money landing in the connected account
- [ ] Wife completed her script and her confusion points are triaged
- [ ] Then follow "Going to production checklist" in
      `docs/stripe-connect-testing.md` to flip to live keys
