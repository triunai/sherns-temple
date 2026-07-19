-- 004_admin_events_write.sql
-- Allow approved admins to create / edit / delete events from the admin dashboard.
-- Public read of Active events (policy "Public read active events") is unchanged.
-- Depends on the SECURITY DEFINER helper is_approved_admin() from 003.

CREATE POLICY "Approved admins insert events" ON public.events
  FOR INSERT TO public WITH CHECK (is_approved_admin());

CREATE POLICY "Approved admins update events" ON public.events
  FOR UPDATE TO public USING (is_approved_admin()) WITH CHECK (is_approved_admin());

CREATE POLICY "Approved admins delete events" ON public.events
  FOR DELETE TO public USING (is_approved_admin());
