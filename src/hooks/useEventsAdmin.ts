import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { Event, EventUpsert } from '@/types';

export function useEventsAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.events.getAll();
      setEvents(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const saveEvent = useCallback(async (id: string | null, data: EventUpsert): Promise<Event> => {
    if (id) {
      const updated = await db.events.update(id, data);
      setEvents((prev) => prev.map((e) => (e.event_id === id ? updated : e)));
      return updated;
    }
    const created = await db.events.create(data);
    setEvents((prev) => [created, ...prev]);
    return created;
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    await db.events.remove(id);
    setEvents((prev) => prev.filter((e) => e.event_id !== id));
  }, []);

  return { events, loading, error, refetch: fetchEvents, saveEvent, deleteEvent };
}
