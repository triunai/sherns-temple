import { supabase } from '@/lib/supabase';
import type { Event, EventInsert, BulletinStatus, EventMaterial } from '@/types';
import { BUCKETS } from '@/config/db';

/** Sanitize a file name: strip special chars, replace spaces with underscores, keep only safe chars */
function sanitizeFileName(name: string): string {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_{2,}/g, '_');
}

export async function uploadPoster(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const base = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
  const fileName = `${Date.now()}_${base.slice(0, 80)}.${ext}`;
  const { error, data } = await supabase.storage
    .from(BUCKETS.EVENT_POSTERS)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage
    .from(BUCKETS.EVENT_POSTERS)
    .getPublicUrl(data.path);
  return urlData.publicUrl;
}

function publishedAtFor(status: BulletinStatus): string | null {
  return status === 'published' ? new Date().toISOString() : null;
}

export async function listAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(values: EventInsert): Promise<Event> {
  const payload = {
    ...values,
    published_at: publishedAtFor(values.status ?? 'draft'),
  };
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, values: Partial<Event>): Promise<Event> {
  const payload = {
    ...values,
    published_at: values.status ? publishedAtFor(values.status) : undefined,
  };
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setEventStatus(id: string, status: BulletinStatus): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({ status, published_at: publishedAtFor(status) })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function getMaterialsByEvent(eventId: string): Promise<EventMaterial[]> {
  const { data, error } = await supabase
    .from('event_materials')
    .select('*')
    .eq('event_id', eventId)
    .not('event_id', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getStandaloneMaterials(): Promise<EventMaterial[]> {
  const { data, error } = await supabase
    .from('event_materials')
    .select('*')
    .is('event_id', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getEventWithMaterials(id: string): Promise<{ event: Event; materials: EventMaterial[] } | null> {
  const { data: event, error: evErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  if (evErr) throw evErr;
  if (!event) return null;
  const materials = await getMaterialsByEvent(id);
  return { event, materials };
}
