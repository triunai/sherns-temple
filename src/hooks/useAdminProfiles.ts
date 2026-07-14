import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { AdminProfile } from '@/types';

export function useAdminProfiles() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.admin.getAllProfiles();
      setAdmins(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const toggleApproval = useCallback(async (userId: string, isApproved: boolean) => {
    const updated = await db.admin.updateApproval(userId, isApproved);
    setAdmins((prev) =>
      prev.map((a) => (a.user_id === userId ? updated : a))
    );
    return updated;
  }, []);

  return { admins, loading, error, refetch: fetchAdmins, toggleApproval };
}
