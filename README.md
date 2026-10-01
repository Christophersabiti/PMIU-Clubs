# PMI Uganda Clubs

**Connect. Participate. Grow. Impact.**

The digital engagement hub for PMI Uganda Chapter Clubs: one platform with one member account, profile and engagement history, plus one admin environment and one analytics layer, covering many clubs, initiatives, activities and partners.

Built from *PMI Uganda Clubs Digital Platform: MVP Product Concept + PRD* and the *PMI Uganda Club Partnership Initiative* (VP Events portfolio, 2026 pilot).

---

## Quick start

1. Create a Supabase project. Copy `.env.example` to `.env.local` (already created with generated `AUTH_SECRET` and `CRON_SECRET`) and fill in:
   `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
2. Then:

```bash
npm install
npm run db:setup     # prisma db push → enable RLS (lock Supabase's public API) → seed clubs, partners, programme
npm run dev          # http://localhost:3000
```

`SEED_DEMO=true npm run db:seed` adds demo captains, members and registrations for testing. **Never run that against production**, because `db:seed` clears all tables first.

### Governance (2026 pilot)
- **One platform administrator** (Super Admin, from `SEED_ADMIN_*`) manages platform roles, partners and settings.
- **Club administrators** are assigned per club under Admin › Clubs › Leadership & roles (Club Captain/Lead, Content Manager, Event Coordinator). Each one only manages their own club.
- **Every club join requires approval.** Requests notify the club's leads and the platform administrator (Admin › Applications).
- Partner representative logins are on hold. Only internal admins have access.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router, Server Components, Server Actions), Tailwind CSS v4 | Responsive PWA |
| Data | Prisma ORM on **Supabase Postgres** (pooled `DATABASE_URL` + `DIRECT_URL`) | Relational model per PRD §28–29, RLS locked |
| Auth | Email + password (bcrypt, signed JWT httpOnly cookie) and optional Google sign-in | PMI Member ID is profile data, never a credential |
| Storage | Supabase Storage (private bucket) behind `/api/media/:id`. Local disk fallback in dev | `src/lib/storage.ts` |
| Email | Resend REST API; falls back to an **outbox** visible in Admin › Communications | |
| QR | `qrcode` (server-rendered SVG) and the browser `BarcodeDetector` scanner | |

### Deploying (Vercel + Supabase + Resend)

1. Import the repo into Vercel and add every variable from `.env.example` (Production and Preview). Set `APP_URL` to the production URL.
2. Database: run `npm run db:setup` once from your machine against the Supabase database (it uses `DIRECT_URL`). After any schema change, run `npm run db:push && npm run db:rls`.
3. Storage: uploads go to a **private** Supabase Storage bucket (`media`, created automatically on first upload) and are served through `/api/media/:id`. Max 4 MB per file (Vercel's request limit is 4.5 MB). Gallery uploads go one photo per request.
4. Email: verify your sending domain in Resend and set `EMAIL_FROM` to an address on it.
5. Cron: `vercel.json` runs `/api/cron/reminders` daily at 08:00 EAT. Vercel sends `CRON_SECRET` automatically. On the Pro plan you can make it hourly.
6. Security: `prisma/supabase-rls.sql` enables RLS with no policies on every table. The app reaches Postgres only through Prisma on the server, so Supabase's public REST API can't read member data.

> Search is case-insensitive (`mode: "insensitive"`). Add Postgres full-text indexes if content grows large.

---

## What's implemented (PRD traceability)

### Must have
| PRD feature | Where |
|---|---|
| Public homepage (hero, club cards, events, impact, partners, news) | `/` |
| Five club pages from **one reusable template** (data-driven, `+ Create Club`) | `/clubs`, `/clubs/[slug]`, Admin › Clubs |
| Registration / login, Google sign-in (optional), password reset | `/register`, `/login`, `/forgot-password` |
| Join journey: Join → Sign in / Create account → Complete profile → Interests → Join request → Approval → Active → Dashboard | `/clubs/[slug]/join`, `/onboarding`, Admin › Applications |
| Join multiple clubs with one account | Club memberships |
| Member profile with all PRD fields and **privacy controls** | `/profile`, `/members/[id]` |
| My Clubs dashboard: Next Up, Recommended, My Engagement, Latest from my clubs | `/dashboard` |
| Club → **Initiative → Activity → Event** model | `/activities`, `/events`, Admin › Initiatives / Activities / Events |
| Events: every PRD field, capacity + **waitlist** (auto-promotion), deadline, hybrid/online, partner, facilitator | `/events/[id]`, Admin › Events |
| Partners module (expertise, clubs, active since, status, activities, resources) | `/partners`, Admin › Partners |
| News / announcements / impact stories, YouTube embeds | `/news`, Admin › News & Announcements |
| Photo upload + galleries (upload → caption → club → event → publish, share) | `/gallery/[id]`, Admin › Galleries |
| Resource library with filters (Articles, Videos, Documents, Templates, Partner Resources) | `/resources`, Admin › Resources |
| Admin CMS (no code needed) | `/admin/*` |
| Role-based access: Super Admin, Chapter Admin, Club Lead, Content Manager, Event Coordinator, Partner Rep, Member, Visitor | `src/lib/permissions.ts` |
| Basic analytics: membership, engagement, club performance, the six primary KPIs | Admin › Dashboard, Reports |
| Community impact dashboard and **live progress to the 31 Dec 2026 pilot targets** | `/impact` |
| Email notifications: welcome, club joined, registration, reminder, cancellation, announcement | `src/lib/notify.ts`, `/api/cron/reminders` |
| Responsive mobile with bottom nav (Home · Clubs · Events · My Clubs · Profile) | `MobileTabBar` |

### Should have (also delivered)
- **QR attendance**: each registration gets a unique QR ticket. The QR encodes the check-in URL, so a coordinator can scan it with any phone camera, or use the in-app scanner or manual entry. Walk-ins are supported.
- **Member directory** that respects privacy settings.
- **Calendar integration**: Google Calendar link and `.ics` for Outlook / Apple.
- **PWA installation**: manifest, icons and a service worker with an offline fallback page.
- **In-app notification centre** (push notifications are Phase 2).

### Security & accessibility
- Every server action re-checks authorization at club scope (e.g. a Fitness lead cannot edit Rotary).
- Uploads: type allowlist verified by **magic bytes**, size limits, generated storage names, sandboxed CSP on served files.
- CSV exports are guarded against formula injection.
- No account enumeration on password reset. Open-redirect-safe `next` parameters.
- Every admin and member action is written to the audit log.
- Accessibility (WCAG 2.2 AA intent): skip link, visible focus, labelled form fields, `aria-live` form feedback, 44 px touch targets, reduced-motion support, alt text.

### Deliberately not built (PRD §32)
Social feed, member chat, LMS, native apps, gamification, AI chatbot, payments, WhatsApp API. WhatsApp community links are stored per club, and the platform stays the source of truth.

---

## Project layout

```
prisma/schema.prisma      data model (users, clubs, memberships, roles, partners, initiatives,
                          activities, events, registrations, attendance, posts, resources,
                          media, galleries, impact metrics, notifications, email log, audit log)
prisma/seed.ts            content from the Club Partnership Initiative
src/lib/                  auth, session, permissions (RBAC), stats/KPIs, mail, notify, storage
src/app/(site)/           public and member pages
src/app/admin/            admin portal
src/app/actions/          server actions (auth, member, admin)
src/app/api/              media, resources, ICS, CSV export, Google OAuth, cron
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run db:setup` | Push schema, enable RLS, seed (first run) |
| `npm run db:push` / `db:rls` | Sync schema / re-apply RLS lockdown |
| `npm run db:seed` | **Clear** and re-seed the database |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |
