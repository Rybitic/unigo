# UniGO

> Your skills are someone else's next big opportunity.

UniGO is a peer-to-peer skill exchange. You list what you can teach and what you want to learn, swipe through people ranked by how well your skills complement each other, and when you both like each other it's a match: you can chat and book learning sessions.

## Run it

```bash
npm install
npm run dev        # http://localhost:5180
```

Click **Try the live demo** on the landing page to sign in as Priya (`priya@unigo.app` / `demo1234`). Her account already has matches, chat history, sessions and incoming likes. You can also **Get Started** to sign up as a new user and go through onboarding.

## What works

- **Auth**: email/password sign-up and login (salted SHA-256), logout, password change, account deletion
- **Onboarding**: a 5-step wizard (photo upload, bio, location, teach/learn skills with levels, format, availability, interests) that ends with a preview of your top matches
- **Discover**: a drag-to-swipe card deck (or ← → ↑ Z keys) with like, pass, undo and view profile, plus filters (category, format, two-way swaps only) and a match celebration
- **Matching engine** (`src/lib/matching.js`): scores every pair from 0 to 100 using profile data:
  - 30 points: they teach what you want to learn
  - 25 points: you teach what they want to learn
  - 10 points: bonus for a two-way swap
  - 15 points: experience-level fit (the teacher should be a step or two ahead of the learner)
  - 10 points: shared interests and shared learning goals
  - 10 points: format, location and availability overlap

  Two-way swaps are ranked first, and every card explains why the match scored the way it did.
- **Mutual matching**: a match is created only when both people like each other. Demo members like you back if their own compatibility score with you is high enough.
- **Messaging**: conversation list, chat history, typing indicator, quick replies, and the other person's profile in a side panel. Demo members reply based on context.
- **Learning sessions**: book a session from a chat, then accept, decline, cancel or mark it complete. Completed sessions feed learning progress.
- **Dashboard, Matches (matches, liked you, sent), Profile (details, skills, availability, connections, progress) and Settings**
- **Responsive layout**: sidebar on desktop, icon rail on tablet, bottom tab bar on mobile

## Data / backend

Accounts and data live in **Supabase** (Postgres + Auth), so you can log in with your email and password from any device.

- `supabase/schema.sql` creates the tables (profiles, swipes, matches, messages, learning_sessions) with row-level security, so people can only read and write their own data and their own matches' chats.
- The browser connects with the project URL and the public anon key, set as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (a `.env.local` file locally, repository variables `SUPABASE_URL` / `SUPABASE_ANON_KEY` for the GitHub Pages build).
- The sample community members are defined in `src/lib/seed.js` and act inside the app. Their likes and replies to you are stored in the database like any other activity.
- **Try the demo** signs into a shared demo account (`priya@unigo.app` / `demo1234`), which is created with its sample history the first time it is used.

Set-up: create a Supabase project, run `supabase/schema.sql` in the SQL Editor, and turn off **Confirm email** under Authentication → Sign In / Providers → Email (otherwise new users must click an email link before logging in).
