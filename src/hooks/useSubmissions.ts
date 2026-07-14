import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { DevoteeSubmission } from '@/types';

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<DevoteeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.submissions.getAll();
      setSubmissions(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const updateApproval = useCallback(
    async (receiptId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
      const updated = await db.submissions.updateApproval(receiptId, status);
      setSubmissions((prev) =>
        prev.map((s) => (s.receipt_id === receiptId ? updated : s))
      );
      return updated;
    },
    []
  );

  return { submissions, loading, error, refetch: fetchSubmissions, updateApproval };
}
