
This provides the exact data points needed to close out the specification. Analyzing the reference poster reveals the design identity: it features a **luxurious, traditional, yet clean layout** using a dark chocolate/charcoal background, rich gold metallic borders, deep crimson accent tones, and clear yellow highlights.

The poster also supplies the real bank coordinates needed to seed your environment.

Here is the final **Technical Implementation Master Pack** designed for a TypeScript + Vite front end paired with a Supabase backend script. You can pass this entire package directly to your code generator to spin up the site in one go.

## 1. Visual Identity Style Tokens (Tailwind CSS Config)

To make the UI perfectly complementary to your traditional temple posters, apply these precise color mappings and styling guidelines to your design tokens:

TypeScript

```
// tailwind.config.js - Theme Overrides
export default {
  theme: {
    extend: {
      colors: {
        temple: {
          bg: '#0F0906',       // Deep traditional charcoal/chocolate dark background
          card: '#1D130E',     // Lighter brown-tinted card background
          gold: '#E5A93B',     // Rich temple gold metallic accent color
          goldLight: '#F3D279',// Bright highlight gold used for titles/borders
          crimson: '#8A151A',  // Deep ceremonial red for buttons and structural status badges
          yellow: '#FFDD00',   // High-contrast yellow for price values and vital notices
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // For crisp UI readability
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E5A93B 0%, #F3D279 50%, #B87E23 100%)',
      }
    }
  }
}
```

### UI Component Guidelines

- **Borders:** Use thin, ornate gold borders (`border border-temple-gold/40`) with slight inner shadows on active prayer cards to echo the traditional frames seen in the poster.
    
- **Buttons:** Apply `bg-gradient-to-r from-temple-crimson to-red-800 text-white font-bold border border-temple-gold/50` for primary actions like "Contribute Now".
    
- **Active Forms:** Keep background surfaces clean and dark (`bg-temple-card`) with inputs highlighted by subtle gold focus rings (`focus:ring-temple-gold`).
    

## 2. Global Setup Variables & Default State

Hardcode these values into your frontend environment config file (`.env` or a global constants file) so that structural payment processing functions immediately.

TypeScript

```
export const TEMPLE_CONSTANTS = {
  PRIEST: {
    NAME: "Gurukal Kumarah",
    WHATSAPP: "+60172776889",
    ALT_CONTACT: "Kumar - 017-277 6889"
  },
  BANK_DETAILS: {
    BANK_NAME: "Maybank",
    ACCOUNT_NAME: "Kumarah Muniandy",
    ACCOUNT_NUMBER: "114133128547",
    QR_ASSET_URL: "/assets/images/maybank-duitnow-qr.png" // Path to your dynamic QR asset
  },
  LOCALIZATION_PLACEHOLDER: "FUTURE_UPDATE_DICT_MARKER" // Reserved for complete 27 Natchatram/12 Rasi automation layer
};
```

## 3. Supabase Backend Schema Script (SQL DDL)

Execute this script inside your Supabase SQL Editor to instantly generate the relational tables, data validation constraints, and the automated calculations needed to update material quantities upon admin verification.

SQL

```
-- Enable UUID generation extension if not present
create extension if not exists "uuid-ossp";

-- =========================================================================
-- TABLE A1: MAIN EVENTS & PRAYERS
-- =========================================================================
create table public.events (
    event_id uuid default uuid_generate_v4() primary key,
    event_name text not null,
    featured_poster text,
    show_in_carousel boolean default false,
    display_qr_asset text,
    bank_details_display text not null,
    cost_per_pax numeric(10,2) not null default 0.00,
    abhishegam_time text,
    pooja_start_time time without time zone,
    special_notes text,
    is_favorited boolean default false, -- Dynamic preset tracking
    status text not null default 'Draft' check (status in ('Draft', 'Active', 'Archived')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- TABLE A2: MATERIAL FUNDING REQUIREMENTS
-- =========================================================================
create table public.event_materials (
    item_id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(event_id) on delete cascade not null,
    material_name text not null,
    target_quantity numeric(10,2) not null check (target_quantity > 0),
    unit_type text not null, -- e.g., 'Liters', 'KG', 'Bottles'
    qty_received numeric(10,2) not null default 0.00 check (qty_received <= target_quantity),
    funding_status text generated always as (
        case when qty_received >= target_quantity then 'Filled' else 'Open' end
    ) stored,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- TABLE B: DEVOTEE SUBMISSION LOG & AUDIT
-- =========================================================================
create table public.devotee_submissions (
    receipt_id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(event_id) on delete restrict not null,
    devotee_name text not null,
    devotee_whatsapp text not null,
    devotee_email text not null,
    primary_natchatram text,
    primary_rasi text,
    family_json jsonb default '[]'::jsonb,      -- Holds dynamic layout configurations for family rows
    sponsored_items jsonb default '[]'::jsonb,    -- Array of specific item IDs and quantities contributed
    total_amount_paid numeric(10,2) not null,
    payment_proof text not null,                 -- Storage bucket URL link
    admin_approval text not null default 'Pending' check (admin_approval in ('Pending', 'Approved', 'Rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- TRIGGER LOGIC: AUTOMATICALLY UPDATE MATERIAL INVENTORIES ON APPROVAL
-- =========================================================================
create or replace function public.process_material_contributions()
returns trigger as $$
declare
    contribution record;
begin
    -- Check if status changed from something else to 'Approved'
    if (TG_OP = 'UPDATE' and NEW.admin_approval = 'Approved' and OLD.admin_approval distinct from 'Approved') then
        
        -- Loop through the JSONB array of sponsored materials
        for contribution in 
            select * from jsonb_to_recordset(NEW.sponsored_items) as x(item_id uuid, qty_given numeric)
        loop
            -- Increment the exact targeted row inside Table A2
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
```

## 4. Frontend Framework Checklist (Vite Boilerplate Structure)

When setting up your TypeScript files, structured routes should follow this clean layout profile:

Plaintext

```
src/
├── assets/                  # Images, 3D Murti model files (.glb)
├── components/
│   ├── AutoCarousel.tsx     # 5s auto-scroll banner logic using element anchors
│   ├── BulletinGrid.tsx     # Maps dynamic events layout grid
│   ├── ContributeTab.tsx    # Step 1, Step 2, Step 3 expandable content container
│   ├── SankalpamForm.tsx    # Handles multi-row dynamic array layout adjustments
│   └── VisualDarshan.tsx    # <model-viewer> engine wrapper for the 3D Render
├── lib/
│   └── supabaseClient.ts    # Initialized Supabase connection scripts
├── App.tsx                  # Main controller handling language states
└── main.tsx
```

Feed this exact compilation directly into your code generator workspace. It holds everything required to yield a one-shot architecture tailored directly to your temple asset parameters!