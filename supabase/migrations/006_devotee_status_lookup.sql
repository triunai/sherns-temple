-- Feature #1: Public devotee status lookup.
-- A SECURITY DEFINER RPC is used instead of a public SELECT policy because RLS
-- cannot restrict *columns* nor enforce an exact-match-only query. This function
-- returns ONLY {event_name, status, submitted_at} for an exact receipt_id match
-- or a WhatsApp-number match (last 9 significant digits). No PII, no list-all.

create or replace function public.get_submission_status(
  p_receipt_id uuid default null,
  p_whatsapp   text default null
)
returns table (
  receipt_id   uuid,
  event_name   text,
  status       text,
  submitted_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select s.receipt_id,
         e.event_name,
         s.admin_approval as status,
         s.created_at     as submitted_at
  from public.devotee_submissions s
  join public.events e on e.event_id = s.event_id
  where
    -- Exact receipt_id match takes precedence.
    (p_receipt_id is not null and s.receipt_id = p_receipt_id)
    or
    -- Otherwise match on the last 9 significant digits of the WhatsApp number,
    -- robust to 0 / +60 / spacing differences. Requires >= 7 digits to run.
    (
      p_receipt_id is null
      and p_whatsapp is not null
      and length(regexp_replace(p_whatsapp, '\D', '', 'g')) >= 7
      and right(regexp_replace(s.devotee_whatsapp, '\D', '', 'g'), 9)
          = right(regexp_replace(p_whatsapp, '\D', '', 'g'), 9)
    )
  order by s.created_at desc
  limit 20;
$$;

-- Lock down and expose only the RPC to public roles.
revoke all on function public.get_submission_status(uuid, text) from public;
grant execute on function public.get_submission_status(uuid, text) to anon, authenticated;
