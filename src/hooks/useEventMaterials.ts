import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import type { EventMaterial } from '@/types';

export function useEventMaterials(eventId: string | null) {
  const [materials, setMaterials] = useState<EventMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setMaterials([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    db.materials
      .getByEvent(eventId)
      .then((data) => {
        if (!cancelled) {
          setMaterials(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [eventId]);

  return { materials, loading, error };
}
