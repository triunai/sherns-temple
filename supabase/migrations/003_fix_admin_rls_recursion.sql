-- =========================================================================
-- MIGRATION 003: FIX RLS INFINITE RECURSION + ADMIN READ-ALL + STORAGE
-- The 002 policies queried admin_profiles from within admin_profiles
-- policies, which Postgres rejects (42P17 infinite recursion). A
-- security-definer helper bypasses RLS for the admin check.
-- Also adds: admin read-all policies for events/materials (the admin
-- dashboard calls getAll()), and storage buckets/policies.
-- =========================================================================

create or replace function public.is_approved_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.admin_profiles
        where user_id = auth.uid() and is_approved = true
    );
$$;

drop policy if exists "Approved admins can read all profiles" on public.admin_profiles;
create policy "Approved admins can read all profiles"
    on public.admin_profiles for select
    using (public.is_approved_admin());

drop policy if exists "Approved admins can update profiles" on public.admin_profiles;
create policy "Approved admins can update profiles"
    on public.admin_profiles for update
    using (public.is_approved_admin());

drop policy if exists "Approved admins can read submissions" on public.devotee_submissions;
create policy "Approved admins can read submissions"
    on public.devotee_submissions for select
    using (public.is_approved_admin());

drop policy if exists "Approved admins can update submissions" on public.devotee_submissions;
create policy "Approved admins can update submissions"
    on public.devotee_submissions for update
    using (public.is_approved_admin());

drop policy if exists "Approved admins read all events" on public.events;
create policy "Approved admins read all events"
    on public.events for select
    using (public.is_approved_admin());

drop policy if exists "Approved admins read all materials" on public.event_materials;
create policy "Approved admins read all materials"
    on public.event_materials for select
    using (public.is_approved_admin());

-- Storage buckets + policies (public read; anon upload for payment proofs)
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true),
       ('event-posters', 'event-posters', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload payment proofs" on storage.objects;
create policy "Anyone can upload payment proofs"
    on storage.objects for insert
    with check (bucket_id = 'payment-proofs');

drop policy if exists "Public read payment proofs" on storage.objects;
create policy "Public read payment proofs"
    on storage.objects for select
    using (bucket_id = 'payment-proofs');

drop policy if exists "Public read event posters" on storage.objects;
create policy "Public read event posters"
    on storage.objects for select
    using (bucket_id = 'event-posters');
