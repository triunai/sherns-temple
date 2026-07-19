# Temple Bulletin — Technical README v1.0

**Taman Midah Maha Mariamman Temple — Fund & Devotee Bulletin Board**
Generated: July 14, 2026 | Version: 1.0.0

---

## 1. WHAT THIS CODE ACTUALLY DOES

This is a single-page web application (SPA) that serves as a digital interactive bulletin board for a Hindu temple. It has two distinct faces:

### Public Devotee View (`/` default)
1. **Hero Carousel** — A horizontal auto-scrolling banner (5s interval) displaying active temple event posters. Clicking any poster smooth-scrolls down to that event's detailed card.
2. **Bulletin Grid** — Cards for each active temple event, with a "Contribute Now" button that expands a 3-step wizard directly beneath the card:
   - **Step 1** — Displays bank transfer details (Maybank account), DuitNow QR code image, and per-person cost.
   - **Step 2** — Registration form capturing contact info (name, WhatsApp, email), optional Natchatram/Rasi dropdowns (27/12 options from Tamil astrology), optional dynamic family member rows, a sponsorship checklist pulled live from the database showing material funding progress bars, and a payment receipt file uploader.
   - **Step 3** — Confirmation showing PENDING status. Once admin approves, a green WhatsApp deep-link button appears, pre-filled with the devotee's event details, Sankalpam, and payment info for the priest.
3. **Language Toggle** — Floating header bar (EN | தமிழ் | BM) that instantly swaps all UI labels, buttons, and form instructions across ~80 translation keys.
4. **Dynamic Material Sponsorship** — Materials hitting 100% funding auto-lock with a "[Filled]" badge; the database trigger prevents over-subscription.

### Admin View (`/admin` via login gate)
1. Password-protected dashboard (VITE_ADMIN_PASSWORD env var).
2. Spreadsheet-style table of all devotee submissions with columns: event name, devotee name, WhatsApp, email, amount, receipt link, approval status, actions.
3. **Approval Toggle** — Dropdown per row (Pending → Approved → Rejected). Changing to "Approved" fires a PostgreSQL trigger that auto-increments `event_materials.qty_received`, updating public progress bars in real time.
4. **WhatsApp Copy Button** — Copies a pre-formatted WhatsApp deep-link message for any submission so the admin can quickly send details to the priest.

---

## 2. WHAT COULD BREAK HERE AND WHY

### Critical Breakage Points

| # | Component | What breaks | Why | Fix |
|---|-----------|-------------|-----|-----|
| 1 | **Supabase connection** | Entire site shows loading spinner or empty grids | `supabaseClient.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env. If missing, the client initializes with a placeholder URL and every query fails silently | Create `.env` file from `.env.example` with real Supabase project credentials |
| 2 | **Supabase storage bucket** | Receipt uploads fail with 404/storage error | The `payment-proofs` bucket must be created manually in Supabase dashboard. The migration SQL includes commented-out bucket creation, but this cannot be done via `create table` migration alone | Run the bucket creation SQL in Supabase SQL Editor: `insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', true);` and set bucket to public |
| 3 | **RLS policies not applied** | Public users can't read events, or submissions fail silently | The migration creates RLS policies but if the Supabase project has RLS already enabled with different policies, they may conflict. Also the admin table uses `auth.role() = 'authenticated'` which requires Supabase Auth to be set up — the V1 admin uses sessionStorage password, not Supabase Auth | For V1, the admin dashboard bypasses RLS by reading submissions through the anon key. If this doesn't work, temporarily disable RLS on `devotee_submissions` or add a public read policy |
| 4 | **Missing QR image asset** | QR code area shows a grey fallback placeholder | The path `/assets/images/maybank-duitnow-qr.png` is referenced in `TEMPLE_CONSTANTS`. If no file exists at `public/assets/images/maybank-duitnow-qr.png`, the `<img>` `onError` handler hides the image and shows placeholder text | Place your actual DuitNow QR PNG at `public/assets/images/maybank-duitnow-qr.png` |
| 5 | **Admin password not set** | Admin login always fails (auth error shown) | `AdminDashboard.tsx` compares input against `import.meta.env.VITE_ADMIN_PASSWORD`. If not set in `.env`, the value is `undefined` and no password will match | Set `VITE_ADMIN_PASSWORD=yourpassword` in `.env` |
| 6 | **Database trigger on approval** | Material quantities don't update when admin approves | The trigger `process_material_contributions()` expects `sponsored_items` to contain `item_id` (UUID) and `qty_given` (numeric). If the JSONB structure doesn't match, the trigger silently processes nothing | Ensure the frontend always sends `{ item_id: string, material_name: string, unit_type: string, qty_given: number }` which it does in `MaterialSponsorship.tsx` |
| 7 | **Empty database (no events)** | Hero carousel is hidden, grid shows "No active events" message | The site needs at least one event with `status = 'Active'` and `show_in_carousel = true` to display | Insert seed data via Supabase dashboard or SQL |
| 8 | **Browser without clipboard API** | WhatsApp copy button fails in old browsers or non-HTTPS origins | `navigator.clipboard.writeText()` requires a secure context (HTTPS or localhost) | Works fine on `localhost` and deployed HTTPS domains. If on HTTP, the button fails silently |
| 9 | **CORS / network issues** | Receipt uploads or queries hang/timeout | Supabase API endpoints may be blocked by corporate firewalls or ad blockers that flag the `.supabase.co` domain | Whitelist the Supabase project URL; test with browser devtools Network tab |
| 10 | **Tailwind purge in production** | Dynamic class names disappear after build | Tailwind scans `src/**/*.{ts,tsx}` for class strings at build time. Class names constructed dynamically (e.g., `bg-${color}-600`) are NOT detected by the purger | The codebase uses only static, fully-written class names. No dynamic string concatenation for Tailwind classes |

### Soft Degradation Points (non-blocking)

| # | Component | What happens | Why |
|---|-----------|-------------|-----|
| 11 | **3D Darshan disabled** (`ENABLE_3D_DARSHAN: false`) | VisualDarshan component is never rendered — no crash | Feature flag in `config/features.ts` |
| 12 | **Family members disabled** (`ENABLE_FAMILY_MEMBERS: false`) | SankalpamForm section is hidden from the registration form | Feature flag — form still submits without `family_json` |
| 13 | **Material sponsorship disabled** (`ENABLE_MATERIAL_SPONSORSHIP: false`) | Sponsorship checklist hidden; only base fee is charged | Feature flag |
| 14 | **Carousel disabled** (`ENABLE_CAROUSEL: false`) | Hero section hidden entirely; page starts with the bulletin grid | Feature flag |
| 15 | **No events marked for carousel** | Carousel section renders nothing (no error) | `db.events.getCarousel()` returns empty array |
| 16 | **Language dictionary missing a key** | Fallback: shows the raw key string (e.g., "unknown_label") | The `t()` function returns the key itself if not found in the dictionary |

---

## 3. WHAT DOES THIS DEPEND ON THAT YOU HAVEN'T SET UP YET

### MUST set up before the site works:

| Dependency | What it is | How to set it up |
|---|---|---|
| **Supabase Project** | PostgreSQL database + storage + API | 1. Create a project at [supabase.com](https://supabase.com)<br>2. Copy the Project URL and anon key<br>3. Paste into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| **Database Tables** | 3 tables + indexes + trigger | 1. Open Supabase SQL Editor<br>2. Paste contents of `supabase/migrations/001_initial_schema.sql`<br>3. Run it |
| **Storage Bucket** | `payment-proofs` bucket for receipt images | 1. Go to Supabase Dashboard → Storage<br>2. Create bucket named `payment-proofs`<br>3. Set to **public** (or the receipt URLs won't be accessible)<br>4. Optional: Set file size limit (e.g., 5MB) |
| **Environment Variables** | `.env` file (not checked into git) | Copy `.env.example` → `.env` and fill in the values:<br>`VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co`<br>`VITE_SUPABASE_ANON_KEY=eyJhbGci...`<br>`VITE_ADMIN_PASSWORD=your-chosen-password` |
| **QR Code Image** | DuitNow/TNG QR code image | Place the actual QR code PNG at `public/assets/images/maybank-duitnow-qr.png` |
| **Seed Data** | At least 1 Active event + materials | Via Supabase dashboard or SQL, insert:<br>1 event (status='Active', show_in_carousel=true)<br>2-3 materials linked to that event's event_id |

### SHOULD set up for production readiness:

| Dependency | What it is | Why it matters |
|---|---|---|
| **Supabase Auth** | Proper user authentication for admin | V1 uses a simple password comparison in the browser (sessionStorage). This is NOT secure for production — the password is in the JS bundle and visible in devtools. Migrate to Supabase Auth (`supabase.auth`) with email/password or magic link for the admin user |
| **Row Level Security for Admin** | Separate RLS policies | Current RLS uses `auth.role() = 'authenticated'` which requires Supabase Auth. Without it, submissions are publicly readable (privacy issue). Either implement Supabase Auth or write a custom policy using a secret header |
| **Supabase Edge Functions** | For sending confirmation emails | The PRD specifies two email templates (pending confirmation + approved notification). These should be implemented as Supabase Edge Functions triggered by database webhooks on `INSERT` and `UPDATE` of `devotee_submissions` |
| **Custom Domain** | Your own domain instead of Vercel/Netlify default | For WhatsApp deep-links and QR codes to work reliably in production |
| **Supabase CLI** | Local development workflow | Install `supabase` CLI for local database, type generation, and migration management: `npx supabase init` |
| **TypeScript Types from Database** | Auto-generated types | Run `npx supabase gen types typescript --linked > src/types/database.ts` to replace the hand-written `types/index.ts` with DB-accurate types |

### NICE to have (not blocking):

| Dependency | What it is |
|---|---|
| **3D Murti Model (.glb file)** | Replace the placeholder 🛕 emoji in VisualDarshan with an actual 3D scan via `<model-viewer>` |
| **Google Analytics / Plausible** | Track devotee engagement and conversion rates |
| **Sentry / error tracking** | Catch JS exceptions from failed Supabase calls in production |
| **Cypress / Playwright E2E tests** | Test the full devotee journey (carousel click → form fill → upload → submit) |

---

## 4. FILE TREE & RESPONSIBILITY MAP

```
src/
├── config/                          # ✏️ EDIT HERE for field changes, feature toggles, dropdown options
│   ├── features.ts                  # Toggle any subsystem on/off (8 flags)
│   ├── db.ts                        # Table/bucket name constants — change if DB names differ
│   ├── forms.ts                     # Contact field definitions + validation rules
│   ├── natchatram.ts                # 27 Natchatram options
│   ├── rasi.ts                      # 12 Rasi options
│   ├── admin.ts                     # Approval state machine + session key
│   └── whatsapp.ts                  # WhatsApp message template builder
│
├── lib/                             # 🔒 CORE — rarely touch after initial setup
│   ├── supabaseClient.ts           # Supabase JS client (reads env vars)
│   ├── constants.ts                 # TEMPLE_CONSTANTS (priest, bank, QR path)
│   ├── db.ts                        # All database query functions
│   └── languageContext.tsx          # Language provider + EN/TA/BM dictionaries
│
├── hooks/                           # 📡 Data layer — components consume these
│   ├── useEvents.ts                 # Fetches active and carousel events
│   ├── useEventMaterials.ts         # Fetches materials for a given event
│   ├── useSubmissions.ts            # Fetches/updates devotee submissions
│   └── useFormSubmit.ts             # Submit mutation with loading/error/success
│
├── types/
│   └── index.ts                     # All TypeScript interfaces
│
├── components/                      # 🎨 UI — replace/restyle individual components here
│   ├── Header.tsx                   # Language toggle + admin login link
│   ├── HeroCarousel.tsx             # 5s auto-scroll image carousel
│   ├── BulletinGrid.tsx             # Event card grid (contains EventCard inline)
│   ├── ContributeTab.tsx            # 3-step wizard + form logic
│   ├── SankalpamForm.tsx            # Dynamic family member rows
│   ├── MaterialSponsorship.tsx      # Sponsorship checklist with progress bars
│   ├── PaymentProofUpload.tsx       # File uploader → Supabase Storage
│   ├── FormField.tsx                # Generic field renderer (text/dropdown/tel/email)
│   ├── AdminDashboard.tsx           # Admin login gate + submissions view
│   ├── SubmissionsTable.tsx         # Spreadsheet table with approval toggles
│   ├── VisualDarshan.tsx            # 3D model viewer (placeholder for now)
│   └── Footer.tsx                   # Temple info + priest contact
│
├── App.tsx                          # Root: public vs admin view routing
├── main.tsx                         # React DOM mount
├── index.css                        # Tailwind directives + custom scrollbar
└── vite-env.d.ts                    # Vite env type declarations
```

---

## 5. QUICK START COMMANDS

```bash
# 1. Install dependencies
npm install

# 2. Create .env from example
cp .env.example .env
# → Edit .env with real Supabase credentials + admin username + password

# 3. Run Supabase migration (copy supabase/migrations/001_initial_schema.sql into Supabase SQL Editor)

# 4. Create storage bucket (in Supabase Dashboard → Storage → New Bucket → "payment-proofs" → Public)

# 5. Insert seed data via Supabase SQL Editor or dashboard

# 6. Place QR code image at public/assets/images/maybank-duitnow-qr.png

# 7. Dev server
npm run dev

# 8. Production build
npm run build

# 9. Type check (no emit)
npm run lint
```

---

## 6. ENV VARIABLES REFERENCE

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Yes | — | Your Supabase project URL (e.g., `https://abc123.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | — | Supabase anon/public API key (starts with `eyJ...`) |

---

## 7. CHANGELOG

### v1.2.0 — Hybrid Materials + Enhanced Admin Event Form (July 14, 2026)

**Database:**
- `supabase/migrations/005_hybrid_materials_operations.sql` — Adds `temple_inclusions` column to `events`, sets default location `3.104526, 101.730841`, makes `event_materials.event_id` and `contributions.event_id` nullable for standalone monthly operations funding, adds RLS policy for public read of standalone materials, updates trigger to safely handle NULL `event_id`

**New:**
- `src/components/MonthlyOperationsCard.tsx` — Standalone card widget displaying event_materials with NULL `event_id` as "Monthly Temple Operational Expenses & Requirements", with full contribution flow (bank details, registration form with Sankalpam + family + receipt upload, WhatsApp pending/approval)
- `src/features/bulletin/hooks/useEventMaterials.ts` — Added `useStandaloneMaterials()` hook (React Query) for fetching standalone materials
- `src/features/bulletin/services/eventAdminService.ts` — Added `uploadPoster(file)` for storage bucket uploads, `getStandaloneMaterials()` for admin queries
- `src/features/bulletin/services/eventService.ts` — Added `getStandaloneMaterials()` for public queries

**Changed:**
- `src/pages/Admin.tsx` EventForm — Added `temple_inclusions` textarea, `pooja_start_time` time picker, `abhishegam_time` changed to `<input type="time">`, `event_date` changed to `<input type="date">`, `location` defaults to `3.104526, 101.730841`, poster file upload with Supabase storage integration, status as native enum selector, all new fields included in save payload
- `src/components/BulletinGrid.tsx` — Renders `MonthlyOperationsCard` below event grid when standalone materials exist; event cards now show `description`, `event_date`, and `temple_inclusions`
- `src/pages/AdminContributions.tsx` — Handles NULL `event_id` by displaying "Monthly Operations" as event name
- `src/types/database.ts` — Updated to reflect nullable `event_id` on `event_materials` and `contributions`, added `temple_inclusions` to `events`
- `src/lib/constants.ts` — Added `DEFAULT_LOCATION`
- `src/config/db.ts` — Added `BUCKETS.EVENT_POSTERS`, `TEMPLE_DEFAULTS`

**Zero impact on:**
- Superadmin security helpers (`current_user_role`, `is_admin`, `is_superadmin`, `is_main_admin_or_higher`)
- Existing RLS policies on `events`, `event_materials`, `contributions`, `profiles`
- Auth flow (useAuth, useRole, RequireRole)

---

### v1.1.0 — Supabase Auth Migration (July 14, 2026)

**Changed (BREAKING):**
- Replaced env-var-based admin login (`VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD`) with production-ready Supabase Auth (`supabase.auth.signInWithPassword`)
- Admin login now validates credentials against Supabase Auth, not against environment variables
- `AdminDashboard.tsx` completely rewritten: uses `useAuth()` hook for session management via `supabase.auth.onAuthStateChange`
- `Header.tsx` now receives optional `userEmail` prop — shows logged-in admin email when in admin view
- `App.tsx` now uses `useAuth()` to pass email to Header

**Added:**
- `supabase/migrations/002_admin_profiles.sql` — New `admin_profiles` table (`user_id` FK to `auth.users`, `is_approved` boolean, `role` enum), RLS policies, auto-create trigger on `auth.users` INSERT, updated RLS on `devotee_submissions` to check `admin_profiles.is_approved`
- `src/hooks/useAuth.ts` — Central auth hook: `session`, `user`, `profile`, `login(email, pw)`, `register(email, pw)`, `logout()`, `forgotPassword(email)`, `updateEmail(newEmail)`, `updatePassword(newPw)`, error mapping
- `src/hooks/useAdminProfiles.ts` — Fetches all admin profiles, `toggleApproval(userId, isApproved)`
- `src/components/AdminLoginView.tsx` — Pill-tab login/register with email + password, password visibility toggle (eye button), Forgot Password trigger, Supabase error-to-translation mapping, register success state
- `src/components/AdminManagementTable.tsx` — Table of all admin profiles with email, role, status, and approve/revoke toggle (superadmin-only)
- `src/components/AccountSettings.tsx` — Two forms: Update Email + Change Password, with validation, loading states, and success/error feedback
- `src/config/admin.ts` — `AUTH_ERROR_MAP` + `mapAuthError()` for Supabase error code → translation key mapping
- ~30 new translation keys per language (EN/TA/BM) covering auth flows, settings, admin management

**Removed:**
- `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` env vars (removed from `.env.example`, `vite-env.d.ts`)
- `ADMIN_PASSWORD_KEY` constant from `src/config/admin.ts`
- `admin_username_placeholder` translation key (replaced by `admin_email_placeholder`)

**New File Tree Additions:**
```
supabase/migrations/
└── 002_admin_profiles.sql          # NEW: admin profiles table + RLS + trigger
src/
├── hooks/
│   ├── useAuth.ts                  # NEW: Supabase Auth lifecycle
│   └── useAdminProfiles.ts         # NEW: admin profile CRUD
└── components/
    ├── AdminLoginView.tsx          # NEW: pill-tab login/register
    ├── AdminManagementTable.tsx    # NEW: admin approval management
    └── AccountSettings.tsx         # NEW: email/password self-service
```

---

### v1.0.1 — Admin Login Update (July 14, 2026)

**Changed:**
- Admin login now requires both username AND password (previously password-only)
- Default credentials: `codeshern@gmail.com` / `Pechiamman1`
- Added `VITE_ADMIN_USERNAME` env variable
- Added translation keys for username placeholder and invalid-credentials error in all 3 languages
- Login form now has labeled Username field + labeled Password field with proper `autoComplete` attributes

---

### v1.0.0 — Initial Release (July 14, 2026)

**Added:**
- Hero auto-scrolling carousel with 5s interval, touch-swipe, and anchor-link navigation
- Bulletin grid with expandable event cards and 3-step contribution wizard
- Dynamic material sponsorship with real-time database progress tracking and auto-lock at 100%
- Multi-language support (EN, தமிழ், BM) with ~80 translation keys via React context
- Family member registration (Sankalpam) with dynamic add/remove rows, Natchatram (27) and Rasi (12) dropdowns
- Payment receipt file upload to Supabase Storage
- Admin dashboard with password gate, spreadsheet-style submissions table, approval toggle (Pending/Approved/Rejected), and WhatsApp link generator
- PostgreSQL trigger for automatic material quantity updates on admin approval
- 8 feature flags in `src/config/features.ts` for toggling individual subsystems
- Centralized form field configuration in `src/config/forms.ts` (add/remove fields without touching components)
- Centralized database query layer in `src/lib/db.ts` (single source of truth for all Supabase calls)
- WhatsApp message builder with templated priest communication in `src/config/whatsapp.ts`
- Custom Tailwind theme with temple color tokens (bg, card, gold, goldLight, crimson, yellow) and gold gradient
- Row-Level Security policies for all 3 tables
- Responsive mobile-first design (single-column below 768px)

**Known Limitations (V1):**
- Admin auth uses browser sessionStorage — NOT secure for production (credentials are in JS bundle)
- No email sending (PRD Templates 1 & 2 require Supabase Edge Functions — not yet implemented)
- 3D Murti render is a placeholder emoji (needs actual .glb 3D model file)
- Devotee submissions are publicly readable via anon key (requires Supabase Auth for proper RLS)
- No audit log for admin actions
- No event creation UI (events must be inserted directly via Supabase dashboard/SQL)
- Carousel uses CSS transform for sliding (no library dependency — works but lacks advanced features like variable-width slides)

---

## 8. WHAT THIS CODE IS ACTUALLY DOING

This application is a **dual-interface temple operations portal** with two separate user flows connected by a shared Supabase database.

### Public Devotee Flow

1. **Hero Carousel** (`HeroCarousel.tsx`): Fetches published events with `show_in_carousel = true`. Renders each event's `featured_poster` in a CSS-translated horizontal slider at 5s intervals. Clicking a poster smooth-scrolls to `#event-{id}` in the bulletin grid below.

2. **Bulletin Grid** (`BulletinGrid.tsx`): Fetches published events via `usePublishedEvents()` (React Query). Renders `EventCard` components in a responsive grid. Additionally uses `useStandaloneMaterials()` to check for materials where `event_id IS NULL` — if any exist, renders a `MonthlyOperationsCard` below the event grid.

3. **Event Cards** (`EventCard` inline in `BulletinGrid.tsx`): Shows poster thumbnail, title, description, date, abhishegam time, temple inclusions, cost badge. Each has a "Contribute Now" button that expands `ContributeTab` — the 3-step contribution wizard (payment details → registration form with Sankalpam + material sponsorship + receipt upload → pending/approved status with WhatsApp link).

4. **Monthly Operations Card** (`MonthlyOperationsCard.tsx`): A standalone full-width card showing materials with NULL `event_id` — progress bars for each standalone requirement (utilities, upkeep) with "Contribute Now" that expands the same full 3-step contribution flow submitting to `contributions` with `event_id: null`.

5. **Language Toggle** (`Header.tsx`): React Context-based translation provider with EN/Tamil/BM dictionaries.

### Admin Flow

1. **Auth** (`src/features/auth/`): `useAuth` hook + `authService` with `signInWithPassword`, `signUp`, `signOut`, `resetPasswordForEmail`. `useRole` hook exposes `role`, `canPublish`, `isSuperadmin`. Routes protected by `RequireRole` component.

2. **Admin Hub** (`Admin.tsx`): Dashboard tab (event statistics) + Listings tab (search/filter/edit/delete events). Inline `EventForm` for create/edit with: title, description, date picker, time pickers (abhishegam/pooja), location (default `3.104526, 101.730841`), temple inclusions, cost per pax, status (draft/published/archived), carousel toggle, featured toggle, poster URL + **file upload** (uploads to `event-posters` storage bucket via `uploadPoster()`).

3. **Contribution Approvals** (`AdminContributions.tsx`): Table of all `contributions` rows with approve/reject/reset toggles. WhatsApp copy button. Superadmin can delete. NULL `event_id` displays as "Monthly Operations".

4. **Role-based security**: Admin APIs check `current_user_role()` via PostgreSQL security definer functions. RLS policies control read/write access per role level.

### Hybrid Materials System

The `event_materials` table now supports two modes:
- **Event-linked** (`event_id` IS NOT NULL): Materials tied to a specific prayer/event. Displayed inside that event card's ContributeTab.
- **Standalone** (`event_id` IS NULL): Materials for monthly operational expenses (utilities, upkeep). Displayed in the dedicated `MonthlyOperationsCard` widget.

Both use the same `contributions` table for submissions, with `event_id` nullable.

---

## 9. WHAT COULD BREAK HERE AND WHY

### 9.1 Supabase Not Configured
**Symptom:** Entire site shows empty states. Admin login does nothing.
**Root cause:** `.env` missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`. The Supabase client throws on construction (see `src/lib/supabase.ts` lines 7-8).
**Fix:** Copy `.env.example` → `.env` with real Supabase credentials. Restart dev server.

### 9.2 Database Migrations Not Deployed (003→005)
**Symptom:** Admin login fails with RLS errors on `profiles` table, or MonthlyOperationsCard doesn't appear.
**Root cause:** Migrations 003 (`profiles`, rebuilt `events`/`contributions`/`event_materials`), 004 (bootstrap superadmin), and 005 (hybrid materials) were never run. The old `admin_profiles` and `devotee_submissions` tables don't exist, while the new schema expects `profiles` and `contributions`.
**Fix:** Run all migrations in order: `001`, `002`, `003`, `004`, `005` in Supabase SQL Editor.

### 9.3 Migration 005 Not Applied
**Symptom:** MonthlyOperationsCard doesn't render, even though standalone materials exist in the DB. Or admin form save fails when setting `temple_inclusions`.
**Root cause:** Migration 005 (`ALTER TABLE ... ADD COLUMN ...`) was not run. The `events` table lacks the `temple_inclusions` column, and `event_materials.event_id` is still NOT NULL.
**Fix:** Run `005_hybrid_materials_operations.sql` in Supabase SQL Editor.

### 9.4 Storage Bucket `event-posters` Not Created
**Symptom:** Poster upload in the admin form fails with 404 error.
**Root cause:** `uploadPoster()` in `eventAdminService.ts` calls `supabase.storage.from('event-posters').upload()`. If the bucket doesn't exist, Supabase returns a 404.
**Fix:** Create the bucket in Supabase Dashboard → Storage → New Bucket → name: `event-posters`, public: ON.

### 9.5 Initial Admin Not Created/Approved
**Symptom:** Cannot log into admin dashboard, or logged in but sees "Pending Approval" screen.
**Root cause:** Migration 004 wiped all users and sets first sign-up as superadmin. If no user exists in `auth.users` or the `profiles` table has no approved admin, login fails.
**Fix:** Use the Register tab to sign up `codeshern@gmail.com` / `Pechiamman1` (first user gets superadmin via migration 004 trigger). Or create via Supabase Dashboard → Auth → Users.

### 9.6 ContributeTab Uses Old Type Names
**Symptom:** TypeScript error in `ContributeTab.tsx` referencing `event.event_id` (old column name) vs `event.id` (current name).
**Root cause:** The codebase was restructured in migration 003 (events renamed `event_id` → `id`). If `ContributeTab.tsx` references the old column name, TypeScript catches it. Both `BulletinGrid.tsx` and `ContributeTab.tsx` now use `event.id` correctly.
**Fix:** Verified — all event references use `event.id`.

### 9.7 MonthlyOperationsCard Shows "Submitted" for Null Events
**Symptom:** After submitting to MonthlyOperationsCard, the WA link generation may fail if the submission has no event_id.
**Root cause:** `buildWhatsAppMessage()` in `config/whatsapp.ts` expects an `Event` object to build the message. For standalone contributions, there's no event to reference.
**Fix:** MonthlyOperationsCard currently shows a simple pending confirmation without WhatsApp link generation (as of v1.2.0). The WA link for standalone contributions will be added in a future iteration.

### 9.8 AdminContributions Shows "Monthly Operations" for Null Events
**Symptom:** In the admin contributions table, some rows show "Monthly Operations" instead of an event name.
**Root cause:** This is intentional behavior. `getEventName()` returns `'Monthly Operations'` when `event_id` is `null/undefined`. No fix needed.

### 9.9 Poster File Upload Hangs
**Symptom:** Clicking Upload in the admin form does nothing, or the button stays in "uploading" state forever.
**Root cause:** The `event-posters` bucket might not be public, so the upload succeeds but the `getPublicUrl()` call returns an inaccessible URL. Or the file is too large (Supabase default limit is 1MB for free tier).
**Fix:** Set the bucket to public. Increase file size limit in Supabase Dashboard → Storage → `event-posters` → Configuration.

---

## 10. WHAT DOES THIS DEPEND ON THAT YOU HAVEN'T SET UP YET

### IMMEDIATE (site won't work without these)

| # | Dependency | Status | Action |
|---|---|---|---|
| 1 | **Supabase project** | Not created | Go to [supabase.com](https://supabase.com), create a new project |
| 2 | **`.env` file** | Not created | Copy `.env.example` → `.env`, add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| 3 | **All migrations** (001–005) | Not deployed | Run all 5 `.sql` files in order in Supabase SQL Editor |
| 4 | **`payment-proofs` storage bucket** | Not created | Create in Supabase Dashboard → Storage → New Bucket → `payment-proofs`, public |
| 5 | **`event-posters` storage bucket** | Not created | Create in Supabase Dashboard → Storage → New Bucket → `event-posters`, public |
| 6 | **Seed data** | Not inserted | Insert at least 1 published event + 2-3 `event_materials` rows |
| 7 | **Initial admin user** | Not created | Use the Register tab to sign up as `codeshern@gmail.com` (first user = superadmin) |
| 8 | **Node.js + npm** | Check installed | `node --version` (needs 18+) |
| 9 | **QR code image** | Not placed | Put DuitNow QR PNG at `public/assets/images/maybank-duitnow-qr.png` |

### SHOULD SET UP (production readiness)

| # | Dependency | Status | Action |
|---|---|---|---|
| 10 | **Supabase SMTP provider** | Not configured | Storage Dashboard → Auth → Settings → SMTP Provider (for Forgot Password + email confirm) |
| 11 | **Email confirmation setting** | Toggle as needed | Auth → Settings → "Make users confirm their email" — OFF for testing, ON for production with SMTP |
| 12 | **Custom domain** | Not configured | Deploy to Vercel/Netlify with proper domain for HTTPS |
| 13 | **Edge Functions for email** | Not implemented | Trigger email notifications on contribution submit/approval via Supabase Edge Functions |

### NICE TO HAVE

| # | Dependency | Status |
|---|---|---|
| 14 | Supabase type regeneration | Not run (`npx supabase gen types typescript --linked > src/types/database.ts`) |
| 15 | Analytics (GA / Plausible) | Not added |
| 16 | Error monitoring (Sentry) | Not added |
| 17 | E2E tests | Not written |
| 4 | **`payment-proofs` storage bucket** | Not created | Create in Supabase Dashboard → Storage → New Bucket → name: `payment-proofs`, public: ON |
| 5 | **QR code image** | Not placed | Put the DuitNow QR PNG at `public/assets/images/maybank-duitnow-qr.png` |
| 6 | **Seed data** | Not inserted | Insert 1+ Active event + 2-3 `event_materials` rows via Supabase SQL Editor or Dashboard |
| 7 | **Initial admin user** | Not created | Create `codeshern@gmail.com` / `Pechiamman1` via Supabase Dashboard → Auth → Users → Add User (check "Auto Confirm User") |
| 8 | **Admin approval** | Not done | After creating the user, run: `UPDATE public.admin_profiles SET is_approved = true, role = 'superadmin' WHERE email = 'codeshern@gmail.com';` |
| 9 | **Node.js + npm** | Check if installed | Run `node --version` and `npm --version`. Need Node 18+ |

### SHOULD SET UP (for production)

| # | Dependency | Status | Action |
|---|---|---|---|
| 10 | **Supabase SMTP provider** | Not configured | Go to Supabase Dashboard → Auth → Settings → SMTP Provider (e.g., Resend, SendGrid). Required for email confirmation, forgot password, and email change flows |
| 11 | **Email confirmation setting** | Toggle as needed | If you want users to confirm their email before logging in, keep confirmation ON and configure SMTP. For testing, turn confirmation OFF |
| 12 | **Custom domain** | Not configured | Deploy to Vercel/Cloudflare with a proper domain for HTTPS |
| 13 | **Edge Functions for email** | Not implemented | Create a Supabase Edge Function triggered by database webhooks on `devotee_submissions` INSERT and UPDATE to send the two PRD email templates |
| 14 | **3D Murti model** | Placeholder only | Replace the 🛕 emoji in `VisualDarshan.tsx` with an actual `<model-viewer>` pointing to a `.glb` file |

### NICE TO HAVE (won't break anything)

| # | Dependency | Status |
|---|---|---|
| 15 | Supabase type generation (`npx supabase gen types`) | Not run |
| 16 | Google Analytics / Plausible tracking | Not added |
| 17 | Error monitoring (Sentry) | Not added |
| 18 | E2E tests (Playwright/Cypress) | Not written |
| 19 | CI/CD pipeline | Not configured |
