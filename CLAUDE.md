# StudyAI — AI Study Assistant

Lean SaaS for MENA/Iraqi students: upload a photo of study material, get an AI-generated study plan, explanation, and quiz. Owner (utrakci) is a non-developer building this with Claude Code.

- **Production:** https://study-assistant-ashy.vercel.app
- **Repo:** github.com/utrakci-maker/study-assistant (public)
- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind, Supabase (Postgres + Auth + Storage), Anthropic API, Resend (email), Vercel (hosting + cron).

## Current state (as of Day 19, 2026-07-21)

All core features are live in production: student self-registration + admin approval, Google OAuth login, admin dashboard (stats/codes/submissions/students tabs), per-student progress analytics (Day 19), manual unlock codes via WhatsApp, forgot-password flow, email notifications, PWA install support.

## Critical gotcha — local dev is broken, test against production instead

`.env.local` cannot be made to work locally. All required secrets (Supabase URL/keys, `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD`, `RESEND_*`, etc.) are marked **Sensitive** on Vercel, which makes them permanently write-only — `vercel env pull` can only retrieve an opaque placeholder, never the real value, and this cannot be undone (Sensitive is one-way). Confirmed by hashing pulled values: they're all identical placeholders.

**Don't waste time trying to fix local dev.** The working pattern for this project:
1. Make the code change.
2. `npx tsc --noEmit` to typecheck (this works fine locally, no secrets needed).
3. Commit + `git push origin main` — Vercel auto-deploys.
4. Verify against production directly: `curl` the live routes, or `vercel logs https://study-assistant-ashy.vercel.app --since 2h` to read real error messages from failed requests.
5. Vercel CLI is installed globally and linked to this project (`utrakci/study-assistant`) — already authenticated as `utrakci-maker`.

## Key files

- `lib/supabase.ts` — `supabase` (anon, browser-safe) and `supabaseAdmin` (service role, server-only)
- `lib/supabaseBrowser.ts` — separate browser client for client components (must use `||` not `??` for env fallbacks — `??` doesn't catch the empty-string values the build system sets when vars are missing)
- `lib/tiers.ts` — tier limits (free: 2/day, 6/mo; single_unlock: 1 upload; pro_monthly: 60/mo)
- `lib/prompts.ts` — `STUDY_PROMPT`, the JSON schema Claude must return (7-step plan, 5-section explanation, 5 quiz questions — this is a lot of content, keep `max_tokens` generous)
- `lib/cacheUtils.ts` — SHA-256 content fingerprint + cache lookup to avoid re-processing identical uploads
- `app/api/upload/route.ts` — **the** active upload endpoint (calls Claude, saves submission, tracks cost). `maxDuration = 60` (Vercel Hobby plan ceiling). Currently `claude-opus-4-8`, `max_tokens: 4096`.
- `app/admin/page.tsx` — admin dashboard (password-gated via `ADMIN_PASSWORD` header, not real auth)

## Known issues / backlog

- Local dev cannot run with real secrets (see gotcha above) — all testing must go through production or a preview deployment.

## Day-by-day log

For full history, `git log --oneline` — commit messages are descriptive per day. Highlights:
- Day 1–9: foundation, upload UI, results page, payment/unlock flow, admin dashboard, landing/pricing pages, security hardening, multilingual support, PWA basics.
- Day 10: student accounts (Supabase Auth), personal dashboards.
- Day 11–14: admin student editing, dashboard streak/topics, smart upload, revenue tracking, Google OAuth, account page, CSV export.
- Day 15–17: self-registration + admin approval, email notifications (Resend), forgot-password flow.
- Day 18: PWA polish — service worker (prod-only, disabled in dev), auto-generated icons, install prompts.
- Day 19: per-student analytics panel in admin (30-day activity chart, top topics, language mix); migrated AI processing from `claude-opus-4-5` to `claude-opus-4-8`; fixed a production bug where the migration's old `max_tokens: 2048` was truncating JSON responses (bumped to 4096); added missing `app/robots.ts`; gitignored next-pwa's auto-generated `public/sw.js` / `workbox-*.js` build artifacts.

## Conventions

- Tailwind, no CSS files. Admin UI uses a dark theme (`bg-gray-800`/`bg-gray-900`); student-facing pages use a light theme (`bg-white`/`bg-blue-50`).
- All server-side DB access uses `supabaseAdmin` (bypasses RLS). The anon key is for future browser-side use.
- Bilingual/trilingual content throughout (Arabic, Kurdish, English) — `detected_language` drives which language the AI responds in.
- WhatsApp (`+9647754822210`) is the primary support/payment channel, not email.
