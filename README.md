# PMI Uganda Clubs

**Connect. Participate. Grow. Impact.**

The digital engagement hub for PMI Uganda Chapter Clubs: one platform with one member account, profile and engagement history, plus one admin environment and one analytics layer, covering many clubs, initiatives, activities and partners.

Built from *PMI Uganda Clubs Digital Platform: MVP Product Concept + PRD* and the *PMI Uganda Club Partnership Initiative* (VP Events portfolio, 2026 pilot).

---

## Quick start

1. Copy the Neon connection strings into `.env.local` (Neon console → Connect, or `vercel env pull .env.local`):
   `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`. `AUTH_SECRET`, `CRON_SECRET` and `SEED_ADMIN_*` are already set.
   Optional locally: `BLOB_READ_WRITE_TOKEN` (otherwise uploads go to `./storage`), `RESEND_API_KEY` (otherwise emails go to the in-app outbox).
2. Then:

```bash
npm install
npm run db:setup     # prisma migrate deploy → bootstrap seed (clubs, partners, programme, platform admin) if the DB is empty
npm run dev          # http://localhost:3000
```

`SEED_DEMO=true npm run db:seed` adds demo captains, members and registrations for testing. **Never run `db:seed` against production**, because it clears all tables first. Use a Neon dev branch for testing.

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
| Data | Prisma ORM on **Neon Postgres** (pooled `DATABASE_URL` + `DATABASE_URL_UNPOOLED`), versioned migrations in `prisma/migrations` | Relational model per PRD §28–29 |
| Auth | Email + password (bcrypt, signed JWT httpOnly cookie) and optional Google sign-in | PMI Member ID is profile data, never a credential |
| Storage | **Vercel Blob** (private store) behind `/api/media/:id`. Local disk fallback in dev | `src/lib/storage.ts` |
| Email | Resend REST API; falls back to an **outbox** visible in Admin › Communications | |
| QR | `qrcode` (server-rendered SVG) and the browser `BarcodeDetector` scanner | |

### Deploying (Vercel + Neon + Vercel Blob + Resend)

Vercel runs the `vercel-build` script on every deploy: `prisma generate` → `prisma migrate deploy` (applies pending migrations) → **bootstrap seed** (only if the database is empty, never wipes) → `next build`.

1. **Neon**: the Neon ↔ Vercel integration injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. With preview branching on, each preview deploy gets its own Neon branch, so migrations are tested there first.
2. **Blob**: Vercel → Storage → create a **private** Blob store and connect it to the project. That adds `BLOB_READ_WRITE_TOKEN`. Uploads are max 4 MB per file (Vercel's request limit is 4.5 MB). Gallery uploads go one photo per request.
3. **Add these in Project → Settings → Environment Variables**: `AUTH_SECRET`, `CRON_SECRET`, `APP_URL` (production URL), `RESEND_API_KEY`, `EMAIL_FROM`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD` (12+ chars; change it after first sign-in, then you can delete the `SEED_ADMIN_*` vars).
4. **Email**: verify your sending domain in Resend and set `EMAIL_FROM` to an address on it.
5. **Cron**: `vercel.json` runs `/api/cron/reminders` daily at 08:00 EAT. Vercel sends `CRON_SECRET` automatically. On the Pro plan you can make it hourly.
6. **Schema changes**: edit `prisma/schema.prisma`, run `npm run db:migrate:dev` against a Neon **dev branch** to create a migration, commit it, and the next deploy applies it.

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
| `npm run db:setup` | Apply migrations, then bootstrap-seed an empty database |
| `npm run db:migrate` / `db:migrate:dev` | Apply migrations / create a new migration (use a Neon dev branch) |
| `npm run db:bootstrap` | Seed only if the database is empty (what Vercel runs) |
| `npm run db:seed` | **Clear** and re-seed the database |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |
