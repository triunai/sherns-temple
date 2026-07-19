-- Feature #5: Approval audit trail
-- Records which admin actioned a submission and when, server-authoritatively.

alter table public.devotee_submissions
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_by_email text,
  add column if not exists approved_at timestamptz;

-- BEFORE UPDATE trigger: whenever admin_approval changes, stamp the acting admin.
-- Uses auth.uid() so the value cannot be spoofed by the client payload.
create or replace function public.set_approval_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.admin_approval is distinct from old.admin_approval then
    new.approved_by := auth.uid();
    new.approved_at := now();
    new.approved_by_email := (
      select email from public.admin_profiles where user_id = auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_approval_audit on public.devotee_submissions;
create trigger trg_set_approval_audit
  before update on public.devotee_submissions
  for each row
  execute function public.set_approval_audit();

-- Trigger functions must not be directly invokable via the REST RPC surface.
revoke all on function public.set_approval_audit() from public, anon, authenticated;
