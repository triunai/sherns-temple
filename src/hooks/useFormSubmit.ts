import { useState, useCallback } from 'react';
import { db } from '@/lib/db';
import type { DevoteeSubmission } from '@/types';

interface SubmitInput {
  event_id: string;
  devotee_name: string;
  devotee_whatsapp: string;
  devotee_email: string;
  primary_natchatram: string | null;
  primary_rasi: string | null;
  family_json: { name: string; natchatram: string; rasi: string }[];
  sponsored_items: { item_id: string; material_name: string; unit_type: string; qty_given: number }[];
  total_amount_paid: number;
  payment_proof: string;
}

export function useFormSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DevoteeSubmission | null>(null);

  const submit = useCallback(async (input: SubmitInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await db.submissions.create({
        ...input,
        admin_approval: 'Pending',
      });
      setResult(data);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setSubmitting(false);
  }, []);

  return { submit, submitting, error, result, reset };
}
