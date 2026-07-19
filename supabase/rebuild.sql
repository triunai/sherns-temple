-- =========================================================================
-- REBUILD SCRIPT — 2026-07-19
-- Drops the mismatched schema in project uqbrewpejdnugxkywasc and rebuilds
-- it from this repo's migrations (001 + 002), then re-inserts the existing
-- Bhairava pooja event and sets up storage buckets/policies.
-- Run the whole file in: Supabase Dashboard → SQL Editor.
-- =========================================================================

-- -------------------------------------------------------------------------
-- STEP 0: Tear down the old (mismatched) schema
-- -------------------------------------------------------------------------
drop table if exists public.event_materials cascade;
drop table if exists public.events cascade;
drop table if exists public.profiles cascade;
drop type if exists public.bulletin_status cascade;

-- -------------------------------------------------------------------------
-- STEP 1: Migration 001 — core schema
-- -------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

create table public.events (
    event_id uuid default uuid_generate_v4() primary key,
    event_name text not null,
    featured_poster text,
    show_in_carousel boolean default false,
    display_qr_asset text,
    bank_details_display text not null default 'Maybank | Kumarah Muniandy | 114133128547',
    cost_per_pax numeric(10,2) not null default 0.00,
    abhishegam_time text,
    pooja_start_time time without time zone,
    special_notes text,
    is_favorited boolean default false,
    status text not null default 'Draft' check (status in ('Draft', 'Active', 'Archived')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.event_materials (
    item_id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(event_id) on delete cascade not null,
    material_name text not null,
    target_quantity numeric(10,2) not null check (target_quantity > 0),
    unit_type text not null,
    qty_received numeric(10,2) not null default 0.00 check (qty_received <= target_quantity),
    funding_status text generated always as (
        case when qty_received >= target_quantity then 'Filled' else 'Open' end
    ) stored,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.devotee_submissions (
    receipt_id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(event_id) on delete restrict not null,
    devotee_name text not null,
    devotee_whatsapp text not null,
    devotee_email text not null,
    primary_natchatram text,
    primary_rasi text,
    family_json jsonb default '[]'::jsonb,
    sponsored_items jsonb default '[]'::jsonb,
    total_amount_paid numeric(10,2) not null,
    payment_proof text not null,
    admin_approval text not null default 'Pending' check (admin_approval in ('Pending', 'Approved', 'Rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_events_status on public.events(status);
create index idx_events_carousel on public.events(show_in_carousel, status);
create index idx_materials_event on public.event_materials(event_id);
create index idx_submissions_event on public.devotee_submissions(event_id);
create index idx_submissions_approval on public.devotee_submissions(admin_approval);

create or replace function public.process_material_contributions()
returns trigger as $$
declare
    contribution record;
begin
    if (TG_OP = 'UPDATE' and NEW.admin_approval = 'Approved' and OLD.admin_approval is distinct from 'Approved') then
        for contribution in
            select * from jsonb_to_recordset(NEW.sponsored_items) as x(item_id uuid, qty_given numeric, material_name text, unit_type text)
        loop
            update public.event_materials
            set qty_received = least(qty_received + contribution.qty_given, target_quantity)
            where item_id = contribution.item_id;
        end loop;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger tr_on_submission_approval
    after update on public.devotee_submissions
    for each row
    execute function public.process_material_contributions();

alter table public.events enable row level security;
alter table public.event_materials enable row level security;
alter table public.devotee_submissions enable row level security;

create policy "Public read active events" on public.events
    for select using (status = 'Active');

create policy "Public read event materials" on public.event_materials
    for select using (
        exists (
            select 1 from public.events
            where events.event_id = event_materials.event_id
            and events.status = 'Active'
        )
    );

create policy "Public insert submissions" on public.devotee_submissions
    for insert with check (true);

-- -------------------------------------------------------------------------
-- STEP 2: Migration 002 — admin profiles & auth
-- -------------------------------------------------------------------------
create table public.admin_profiles (
    user_id uuid references auth.users(id) on delete cascade primary key,
    email text not null,
    is_approved boolean not null default false,
    role text not null default 'admin' check (role in ('superadmin', 'admin')),
    created_at timestamp with time zone default now() not null
);

create index idx_admin_profiles_approved on public.admin_profiles(is_approved);

alter table public.admin_profiles enable row level security;

create policy "Users can read own admin profile"
    on public.admin_profiles for select
    using (user_id = auth.uid());

create policy "Approved admins can read all profiles"
    on public.admin_profiles for select
    using (
        exists (
            select 1 from public.admin_profiles ap
            where ap.user_id = auth.uid() and ap.is_approved = true
        )
    );

create policy "Approved admins can update profiles"
    on public.admin_profiles for update
    using (
        exists (
            select 1 from public.admin_profiles ap
            where ap.user_id = auth.uid() and ap.is_approved = true
        )
    );

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

create policy "Approved admins can read submissions"
    on public.devotee_submissions for select
    using (
        exists (
            select 1 from public.admin_profiles
            where user_id = auth.uid() and is_approved = true
        )
    );

create policy "Approved admins can update submissions"
    on public.devotee_submissions for update
    using (
        exists (
            select 1 from public.admin_profiles
            where user_id = auth.uid() and is_approved = true
        )
    );

-- -------------------------------------------------------------------------
-- STEP 3: Gap fix — admin dashboard calls events.getAll(), but 001 only
-- lets the public read Active events. Approved admins need to see all.
-- -------------------------------------------------------------------------
create policy "Approved admins read all events"
    on public.events for select
    using (
        exists (
            select 1 from public.admin_profiles
            where user_id = auth.uid() and is_approved = true
        )
    );

create policy "Approved admins read all materials"
    on public.event_materials for select
    using (
        exists (
            select 1 from public.admin_profiles
            where user_id = auth.uid() and is_approved = true
        )
    );

-- -------------------------------------------------------------------------
-- STEP 4: Storage — buckets + policies
-- (event-posters already exists; on conflict makes this idempotent)
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true),
       ('event-posters', 'event-posters', true)
on conflict (id) do nothing;

-- Devotees are anonymous, so payment-proof uploads must be allowed for anon
create policy "Anyone can upload payment proofs"
    on storage.objects for insert
    with check (bucket_id = 'payment-proofs');

create policy "Public read payment proofs"
    on storage.objects for select
    using (bucket_id = 'payment-proofs');

create policy "Public read event posters"
    on storage.objects for select
    using (bucket_id = 'event-posters');

-- -------------------------------------------------------------------------
-- STEP 5: Re-insert the existing event (mapped from the old schema's row)
-- -------------------------------------------------------------------------
insert into public.events (
    event_name, featured_poster, show_in_carousel, bank_details_display,
    cost_per_pax, abhishegam_time, pooja_start_time, special_notes, status
) values (
    'Bhairava pooja',
    'https://uqbrewpejdnugxkywasc.supabase.co/storage/v1/object/public/event-posters/1784453301888_Ganesha_SVG-Photoroom.png',
    true,
    'Maybank | Kumarah Muniandy | 114133128547',
    31.00,
    '18:30',
    '20:30',
    '16th days post consecration — 25 July 2026',
    'Active'
);
