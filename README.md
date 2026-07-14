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

This application is a **dual-interface temple operations portal** with two separate user flows connected by a shared Supabase database:

### Public Devotee Flow (what a devotee sees)

1. **Hero Carousel** (`HeroCarousel.tsx`): On load, queries `events` table for records where `show_in_carousel = true AND status = 'Active'`. Renders each event's `featured_poster` image in a CSS-translated horizontal slider. A `setInterval` advances one slide every 5000ms. Touch events handle mobile swipe. Clicking a poster calls `document.getElementById('event-{id}').scrollIntoView({ behavior: 'smooth' })` to jump to the matching card below.

2. **Bulletin Grid** (`BulletinGrid.tsx`): Fetches all active events, maps them into `EventCard` components in a responsive CSS grid (1col / 2col / 3col). Each card has a "Contribute Now" button that toggles an `expandedId` state — only one card is expanded at a time.

3. **3-Step Contribution Wizard** (`ContributeTab.tsx`, inside each expanded card):
   - **Step 1**: Renders bank details from `TEMPLE_CONSTANTS` (Maybank, Kumarah Muniandy, 114133128547) and displays the QR code image at `/assets/images/maybank-duitnow-qr.png`.
   - **Step 2**: Renders the registration form. Contact fields (`CONTACT_FIELDS` config) drive the `FormField` component, which renders text/tel/email inputs or dropdowns depending on the field type. `SankalpamForm` manages a dynamic array of family members via React state. `MaterialSponsorship` fetches live `event_materials` rows and renders each with a progress bar — inputs auto-disable when `funding_status = 'Filled'`. `PaymentProofUpload` sends the selected image file to `db.storage.uploadPaymentProof()`, which uses `supabase.storage.from('payment-proofs').upload()`. On submit, `useFormSubmit.send()` calls `db.submissions.create()` which inserts into `devotee_submissions` with `admin_approval = 'Pending'`.
   - **Step 3**: Shows the receipt ID and a PENDING status message. If the submission's `admin_approval` is `'Approved'`, a green WhatsApp deep-link button appears. The link is built by `buildWhatsAppMessage()` in `config/whatsapp.ts` which formats the devotee's name, Natchatram, Rasi, family members, sponsored items, and payment amount into a pre-filled WhatsApp URL template (`wa.me/60172776889?text=...`).

4. **Language Toggle** (`Header.tsx`): The `LanguageProvider` wraps the entire app. When EN/TA/BM is selected, `setLanguage()` updates context, and every component calling `t(key)` gets the translated string from the matching dictionary object in `languageContext.tsx`.

### Admin Flow — Supabase Auth (what the temple manager sees)

1. **Auth Session** (`useAuth` hook in `src/hooks/useAuth.ts`): On mount, calls `supabase.auth.getSession()` to restore any existing session (persisted via Supabase's built-in JWT storage/cookie). Subscribes to `supabase.auth.onAuthStateChange` to react to login/logout events in real time. Exposes `session`, `user`, `profile`, `isApproved`, `login()`, `register()`, `logout()`, `forgotPassword()`, `updateEmail()`, `updatePassword()`.

2. **Login/Register UI** (`AdminLoginView.tsx`): Pill-tab component with two states:
   - **Login tab**: Email input + password input (with eye-icon visibility toggle) + "Forgot Password?" text trigger calling `supabase.auth.resetPasswordForEmail()`. Errors map from Supabase error codes (e.g., `invalid_credentials`) to localized strings via `AUTH_ERROR_MAP` in `config/admin.ts`.
   - **Register tab**: Email + password + confirm password (both with visibility toggles). Calls `supabase.auth.signUp()`, which creates the user in `auth.users` and the database trigger `handle_new_admin_user()` inserts a row into `admin_profiles` with `is_approved = false`.

3. **Approval Gating** (`AdminDashboard.tsx`): After login, the `useAuth` hook fetches the user's `admin_profiles` row. Three possible states:
   - **Not logged in** → renders `AdminLoginView`
   - **Logged in but `is_approved = false`** → renders a "Pending Admin Approval" screen with a message to wait
   - **Logged in and approved** → renders the full dashboard with tab navigation

4. **Submissions Table** (`SubmissionsTable.tsx`): `useSubmissions()` calls `db.submissions.getAll()` to fetch all `devotee_submissions` rows. Each row displays the event name (joined from the events array), devotee details, amount, receipt link, and an approval-status dropdown. When status changes, `db.submissions.updateApproval()` runs an `UPDATE` on the row. The PostgreSQL trigger `process_material_contributions()` fires on `AFTER UPDATE` — it iterates `sponsored_items` JSONB and increments `event_materials.qty_received`. A "WA" button copies a pre-formatted WhatsApp deep-link to the clipboard.

5. **Admin Management** (`AdminManagementTable.tsx`): Lists all `admin_profiles` (except the current user). The superadmin (`role = 'superadmin'`) can toggle `is_approved` for any other admin via `db.admin.updateApproval()`. RLS restricts this to approved admins only.

6. **Account Settings** (`AccountSettings.tsx`): Two forms:
   - **Update Email**: Calls `supabase.auth.updateUser({ email })` with the new email.
   - **Change Password**: Validates confirmation match, then calls `supabase.auth.updateUser({ password })`.

### The `admin_profiles` DB Schema

```sql
create table public.admin_profiles (
    user_id uuid references auth.users(id) primary key,
    email text not null,
    is_approved boolean default false,
    role text check (role in ('superadmin', 'admin')),
    created_at timestamptz default now()
);
```

- A PostgreSQL trigger `handle_new_admin_user()` fires on `INSERT INTO auth.users` and auto-creates a profile row with `is_approved = false`.
- RLS: any authenticated user can read their own profile (needed for approval gating). Only approved admins can list all profiles or update them.
- The seed `codeshern@gmail.com` user must be created via Supabase Dashboard → Authentication → Users, then manually set to `is_approved = true, role = 'superadmin'` in the `admin_profiles` table.

### Shared Infrastructure

- **`src/lib/db.ts`**: Every Supabase query lives here. Components never call `supabase.from()` directly. If a table name changes, you fix one file.
- **`src/config/features.ts`**: 8 boolean flags. Toggle any subsystem (carousel, 3D, sponsorship, family, upload, admin) without touching components.
- **`src/config/forms.ts`**: Form fields are defined as data objects. Adding a new field to the registration form requires only adding one entry to `CONTACT_FIELDS` and one translation key per language.
- **`src/config/admin.ts`**: Maps Supabase Auth error codes to translation keys via `AUTH_ERROR_MAP`. The `mapAuthError()` function in this file is used by `useAuth.ts` to convert Supabase's raw error messages into localized user-facing strings.

---

## 9. WHAT COULD BREAK HERE AND WHY

### 9.1 Supabase Auth Not Configured (MOST LIKELY)
**Symptom:** Admin login/register does nothing, or Supabase returns `AuthApiError`.
**Root cause:** The `.env` file is missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`. The `supabaseClient.ts` initializes with placeholder values, and all auth calls fail.
**Fix:** Create `.env` from `.env.example` with real Supabase project credentials. Restart the dev server.

### 9.2 Database Schema Not Deployed (Migration 002)
**Symptom:** Admin Dashboard shows "Pending Approval" but never transitions to the approved state, or the admin management table is empty.
**Root cause:** The `002_admin_profiles.sql` migration has not been run. The trigger `handle_new_admin_user()` does not exist, so new registrations don't create `admin_profiles` rows. Or the RLS policies on `devotee_submissions` still use the old `auth.role() = 'authenticated'` check.
**Fix:** Run `002_admin_profiles.sql` in the Supabase SQL Editor after running `001_initial_schema.sql`.

### 9.3 Initial Admin Not Created/Approved
**Symptom:** Cannot log into admin dashboard. Or logs in but sees only the "Pending Approval" screen.
**Root cause:** The initial admin `codeshern@gmail.com` must be created in Supabase Auth AND then approved in the `admin_profiles` table. The trigger creates the profile automatically when the user signs up, but `is_approved` defaults to `false`.
**Fix:** 
1. Create the user: Supabase Dashboard → Authentication → Users → Add User → Email: `codeshern@gmail.com`, Password: `Pechiamman1`, check "Auto Confirm User".
2. Approve the profile: run `UPDATE public.admin_profiles SET is_approved = true, role = 'superadmin' WHERE email = 'codeshern@gmail.com';`

### 9.4 Email Confirmation Required but Not Configured
**Symptom:** When logging in, Supabase returns `Email not confirmed`. The login fails.
**Root cause:** Supabase Auth is configured to require email confirmation (default). New users must click a confirmation link before they can log in. The seed admin must have `email_confirmed_at` set.
**Fix (option 1):** When creating the seed user in Supabase Dashboard, check "Auto Confirm User" (sets `email_confirmed_at = now()`).
**Fix (option 2):** Disable email confirmation in Supabase Dashboard → Authentication → Settings → "Make users confirm their email" = OFF (less secure, but simpler for testing).
**Fix (option 3):** Configure SMTP in Supabase Dashboard → Authentication → Settings → SMTP Provider to actually send confirmation emails.

### 9.5 RLS on admin_profiles Blocks Self-Read
**Symptom:** After login, the user is stuck on loading and never sees the pending approval screen.
**Root cause:** The RLS policy `"Users can read own admin profile"` might not exist or is misconfigured. Without it, the `db.admin.getProfile()` call throws a 403 error.
**Fix:** Ensure the policy is in `002_admin_profiles.sql` and has been applied: `create policy "Users can read own admin profile" on public.admin_profiles for select using (user_id = auth.uid());`

### 9.6 Admin Management Table Fails for Non-Superadmin
**Symptom:** Admin Management tab shows "No other admins registered" or loading spinner.
**Root cause:** `db.admin.getAllProfiles()` requires an approved admin. If the current user's `is_approved` is false or the RLS policy blocks their read, the query returns nothing.
**Fix:** Ensure the approved status is set correctly. The superadmin should be the only one who can toggle others.

### 9.7 Account Settings Update Fails
**Symptom:** Changing email or password returns an error.
**Root cause:** `supabase.auth.updateUser()` requires a recent login session and a confirmed email. If the session is too old or the email isn't confirmed, Supabase may reject the update.
**Fix:** Re-login before updating credentials. If updating email, Supabase sends a confirmation to the new email — the user must click it before the change takes effect.

### 9.8 Forgot Password Requires SMTP
**Symptom:** "Forgot Password?" says a reset link was sent, but the email never arrives.
**Root cause:** `supabase.auth.resetPasswordForEmail()` requires Supabase to be able to send emails. Without SMTP configuration in the Supabase project, the email is never sent.
**Fix:** Configure SMTP in Supabase Dashboard → Authentication → Settings → SMTP Provider. Or use a third-party email service (SendGrid, Resend, etc.).

### 9.9 Supabase Project Has Email Confirmations Disabled
**Symptom:** Registration returns success but the user still can't log in.
**Root cause:** If email confirmations are disabled (a project setting), `supabase.auth.signUp()` creates the user with `email_confirmed_at` already set. The registration flow should then immediately allow login. However, if the "Auto Confirm User" setting in the project is OFF, the sign up creates an unconfirmed user.
**Fix:** Check the Supabase Authentication → Settings → "Make users confirm their email" toggle. For development, disabling this simplifies the flow. For production, configure SMTP.

### 9.10 Database Trigger for admin_profiles Fails on Signup
**Symptom:** After signing up via the Register tab, the `admin_profiles` table has no row for the new user.
**Root cause:** The trigger `handle_new_admin_user()` might not exist or might have been created with insufficient privileges (needs `security definer` to write to `admin_profiles` from `auth.users` trigger).
**Fix:** Verify the trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_admin_user_created';`. Re-run the trigger creation block from `002_admin_profiles.sql`.

---

## 10. WHAT DOES THIS DEPEND ON THAT YOU HAVEN'T SET UP YET

### IMMEDIATE (site won't work without these)

| # | Dependency | Status | Action |
|---|---|---|---|
| 1 | **Supabase project** | Not created | Go to [supabase.com](https://supabase.com), create a new project, note the URL and anon key |
| 2 | **`.env` file** | Not created (only `.env.example` exists) | Copy `.env.example` → `.env`, fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| 3 | **Database migrations** | Not deployed | Run `001_initial_schema.sql` AND `002_admin_profiles.sql` in Supabase SQL Editor (in order) |
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
