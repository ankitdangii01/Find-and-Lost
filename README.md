# CampusFind — Campus Lost & Found

A campus-restricted Lost & Found web app. Any student can report lost/found items, claim items posted by other students, and resolve them back to their owner.

## Stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + Auth + Storage + RLS)
- React Router 7, lucide-react, date-fns

## Features

- Email signup/login (Supabase Auth, autoconfirmed)
- Report **Lost** or **Found** items with category, campus location, date, and optional image
- Browse + search + filter by category, location, and status
- Claim items with a message; owners accept/reject claims
- Verification questions shown to claimants
- Notifications on claims, acceptance, and resolution
- My Reports / My Claims / Profile — each user only sees their own data
- Full Row Level Security; items can only be claimed once per user

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm run dev                   # http://localhost:5173
```

## Building

```bash
npm run build
npm run preview
```

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (framework is auto-detected: Vite).
2. In **Project -> Settings -> Environment Variables**, add the same variables as `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy. `vercel.json` configures SPA rewrites (client-side routing) and `dist` output.

## Supabase setup

`database/schema.sql` is the source of truth for the backend:

- Tables: `profiles`, `items`, `claims`, `notifications`
- Public storage bucket `item-images` for photos
- RLS policies (users see only their own reports/claims; active items are public to signed-in users)
- `handle_new_user` trigger auto-creates a profile on signup
- `is_claimant()` SECURITY DEFINER helper breaks the items<->claims RLS recursion

Apply it in the Supabase SQL editor (or from a migration). Seed demo data with the auth-API script in `scripts/seed-demo.js` (demo accounts: `demo.rohan@sati.ac.in`, `demo.aisha@sati.ac.in`, `demo.varun@sati.ac.in`, password `Demo@Public123`).