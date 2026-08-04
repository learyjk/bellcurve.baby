# bellcurve.baby

Next.js 15 app (App Router) + Supabase + Stripe. Dev server: `npm run dev` on port 8000.

## Heather copy-editing workflow

Heather (the owner's wife) makes copy changes by emailing
`heather@bellcurve-baby.exe.xyz`. These requests arrive in
Shelley conversations via `/home/exedev/bin/heather-mail-handler`. If a user
message starts with `[EMAIL FROM HEATHER`, follow its embedded instructions:

- All her work happens on the **`heather` branch** (`git checkout heather`).
- **Never commit to `main` directly**, and never merge to `main` unless her
  message explicitly approves shipping ("ship it", "looks good, publish", etc.).
- Production deploys automatically when `main` is pushed to GitHub.
- The dev preview at https://bellcurve-baby.exe.xyz serves whatever branch is
  checked out locally — keep the working tree on `heather` when doing her work
  so she sees her changes.
- Reply to her by email with `/home/exedev/bin/heather-reply` (instructions in
  the prompt). Keep replies short, warm, plain text. Sign "— Shelley".
- After merging to main, rebase `heather` onto `origin/main` and switch back
  to `heather`.
- Her email address is stored in `/home/exedev/heather-mail/sender`.
