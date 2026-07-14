-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =========================================================================
-- TABLE A1: MAIN EVENTS & PRAYERS
-- =========================================================================
create table if not exists public.events (
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

-- =========================================================================
-- TABLE A2: MATERIAL FUNDING REQUIREMENTS
-- =========================================================================
create table if not exists public.event_materials (
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

-- =========================================================================
-- TABLE B: DEVOTEE SUBMISSION LOG & AUDIT
-- =========================================================================
create table if not exists public.devotee_submissions (
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

-- =========================================================================
-- INDEXES
-- =========================================================================
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_carousel on public.events(show_in_carousel, status);
create index if not exists idx_materials_event on public.event_materials(event_id);
create index if not exists idx_submissions_event on public.devotee_submissions(event_id);
create index if not exists idx_submissions_approval on public.devotee_submissions(admin_approval);

-- =========================================================================
-- TRIGGER: AUTO-UPDATE MATERIAL QUANTITIES ON APPROVAL
-- =========================================================================
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

drop trigger if exists tr_on_submission_approval on public.devotee_submissions;
create trigger tr_on_submission_approval
    after update on public.devotee_submissions
    for each row
    execute function public.process_material_contributions();

-- =========================================================================
-- STORAGE BUCKETS
-- =========================================================================
-- Run these separately via Supabase dashboard or SQL with appropriate permissions:
-- insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', true);
-- insert into storage.buckets (id, name, public) values ('event-posters', 'event-posters', true);

-- =========================================================================
-- RLS POLICIES (Public read, authenticated write)
-- =========================================================================
alter table public.events enable row level security;
alter table public.event_materials enable row level security;
alter table public.devotee_submissions enable row level security;

-- Events: public can read active events
create policy "Public read active events" on public.events
    for select using (status = 'Active');

-- Event materials: public can read materials for active events  
create policy "Public read event materials" on public.event_materials
    for select using (
        exists (
            select 1 from public.events
            where events.event_id = event_materials.event_id
            and events.status = 'Active'
        )
    );

-- Devotee submissions: public can insert, no read (privacy)
create policy "Public insert submissions" on public.devotee_submissions
    for insert with check (true);

-- Devotee submissions: authenticated users can read/update
create policy "Authenticated read submissions" on public.devotee_submissions
    for select using (auth.role() = 'authenticated');

create policy "Authenticated update submissions" on public.devotee_submissions
    for update using (auth.role() = 'authenticated');
