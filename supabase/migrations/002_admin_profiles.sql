-- =========================================================================
-- MIGRATION 002: ADMIN PROFILES & SUPABASE AUTH INTEGRATION
-- =========================================================================

-- 1. ADMIN PROFILES TABLE
create table if not exists public.admin_profiles (
    user_id uuid references auth.users(id) on delete cascade primary key,
    email text not null,
    is_approved boolean not null default false,
    role text not null default 'admin' check (role in ('superadmin', 'admin')),
    created_at timestamp with time zone default now() not null
);

-- 2. INDEX
create index if not exists idx_admin_profiles_approved on public.admin_profiles(is_approved);

-- 3. ROW LEVEL SECURITY
alter table public.admin_profiles enable row level security;

-- Any authenticated user can read their own profile (needed for approval gating)
create policy "Users can read own admin profile"
    on public.admin_profiles for select
    using (user_id = auth.uid());

-- Only approved admins can list all profiles
create policy "Approved admins can read all profiles"
    on public.admin_profiles for select
    using (
        exists (
            select 1 from public.admin_profiles ap
            where ap.user_id = auth.uid() and ap.is_approved = true
        )
    );

-- Only approved admins can update profiles (toggle approval, change role)
create policy "Approved admins can update profiles"
    on public.admin_profiles for update
    using (
        exists (
            select 1 from public.admin_profiles ap
            where ap.user_id = auth.uid() and ap.is_approved = true
        )
    );

-- 4. TRIGGER: AUTO-CREATE PROFILE ON auth.users INSERT
create or replace function public.handle_new_admin_user()
returns trigger as $$
begin
    insert into public.admin_profiles (user_id, email, is_approved, role)
    values (new.id, new.email, false, 'admin');
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_admin_user_created on auth.users;
create trigger on_admin_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_admin_user();

-- 5. UPDATE EXISTING RLS POLICIES ON DEVOTEE_SUBMISSIONS
-- Drop old auth-role-based policies
drop policy if exists "Authenticated read submissions" on public.devotee_submissions;
drop policy if exists "Authenticated update submissions" on public.devotee_submissions;

-- Only approved admins can read devotee submissions
create policy "Approved admins can read submissions"
    on public.devotee_submissions for select
    using (
        exists (
            select 1 from public.admin_profiles
            where user_id = auth.uid() and is_approved = true
        )
    );

-- Only approved admins can update submissions
create policy "Approved admins can update submissions"
    on public.devotee_submissions for update
    using (
        exists (
            select 1 from public.admin_profiles
            where user_id = auth.uid() and is_approved = true
        )
    );

-- 6. SEEDING INSTRUCTIONS
-- After running this migration, create the initial admin via:
--   Supabase Dashboard → Authentication → Users → Add User
--   Email: codeshern@gmail.com
--   Password: Pechiamman1
--   Check: "Auto Confirm User" (sets email_confirmed_at)
--
-- Then manually approve the profile:
--   UPDATE public.admin_profiles
--   SET is_approved = true, role = 'superadmin'
--   WHERE email = 'codeshern@gmail.com';
