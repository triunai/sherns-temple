import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { db } from '@/lib/db';
import type { SubmissionStatusResult, ApprovalStatus } from '@/types';

function statusBadgeClass(status: ApprovalStatus): string {
  switch (status) {
    case 'Approved':
      return 'bg-green-600 text-white';
    case 'Rejected':
      return 'bg-red-600 text-white';
    default:
      return 'bg-temple-yellow text-black';
  }
}

function formatSubmittedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function DevoteeStatusLookup() {
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [refValue, setRefValue] = useState('');
  const [waValue, setWaValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<SubmissionStatusResult[] | null>(null);

  function resetPanel() {
    setRefValue('');
    setWaValue('');
    setMessage(null);
    setResults(null);
    setLoading(false);
  }

  async function handleSubmit() {
    const ref = refValue.trim();
    const wa = waValue.trim();

    setMessage(null);
    setResults(null);

    if (!ref && !wa) {
      setMessage(t('status_lookup_empty_input'));
      return;
    }

    setLoading(true);
    try {
      // Prefer the reference ID when both fields are filled.
      const data = await db.submissions.getStatus({
        receiptId: ref || undefined,
        whatsapp: ref ? undefined : wa || undefined,
      });
      setResults(data);
      if (data.length === 0) {
        setMessage(t('status_lookup_none'));
      }
    } catch {
      setMessage(t('status_lookup_error'));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-press w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg border border-temple-gold/20 bg-temple-card text-temple-goldLight text-sm font-semibold px-4 py-2.5 hover:border-temple-gold/40 animate-fade-in"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-temple-gold"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        {t('status_lookup_open')}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-temple-gold/20 bg-temple-card p-4 sm:p-5 space-y-4 animate-scale-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <span className="gold-label">{t('status_lookup_title')}</span>
          <p className="text-xs text-white/60">{t('status_lookup_subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetPanel();
            setOpen(false);
          }}
          aria-label={t('status_lookup_close')}
          className="btn-press shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-temple-gold/20 text-temple-goldLight/70 hover:text-temple-goldLight hover:border-temple-gold/40"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Reference ID */}
      <div className="space-y-1">
        <label
          htmlFor="status-lookup-ref"
          className="block text-xs font-medium text-temple-goldLight/80"
        >
          {t('status_lookup_ref_label')}
        </label>
        <input
          id="status-lookup-ref"
          type="text"
          value={refValue}
          onChange={(e) => setRefValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('status_lookup_ref_placeholder')}
          autoComplete="off"
          className="w-full min-h-[44px] px-3 py-2.5 bg-temple-bg border border-temple-gold/40 rounded-lg text-white text-base sm:text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
        />
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-temple-gold/20" aria-hidden="true" />
        <span className="gold-label">{t('status_lookup_or')}</span>
        <span className="h-px flex-1 bg-temple-gold/20" aria-hidden="true" />
      </div>

      {/* WhatsApp */}
      <div className="space-y-1">
        <label
          htmlFor="status-lookup-wa"
          className="block text-xs font-medium text-temple-goldLight/80"
        >
          {t('status_lookup_wa_label')}
        </label>
        <input
          id="status-lookup-wa"
          type="tel"
          value={waValue}
          onChange={(e) => setWaValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('status_lookup_wa_placeholder')}
          autoComplete="tel"
          className="w-full min-h-[44px] px-3 py-2.5 bg-temple-bg border border-temple-gold/40 rounded-lg text-white text-base sm:text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="btn-press w-full min-h-[44px] flex items-center justify-center rounded-lg bg-crimson-gradient text-white text-sm font-semibold px-4 py-2.5 border border-temple-gold/50 disabled:opacity-50"
      >
        {loading ? t('status_lookup_checking') : t('status_lookup_submit')}
      </button>

      {/* Inline message (empty input / none found / error) */}
      {message && (
        <p className="text-xs text-center text-temple-goldLight/80 bg-temple-bg/60 border border-temple-gold/20 rounded-lg p-3 animate-fade-in">
          {message}
        </p>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <span className="gold-label">{t('status_lookup_result_title')}</span>
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.receipt_id}
                className="rounded-lg border border-temple-gold/20 bg-temple-bg/60 p-3 space-y-2 animate-scale-in"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <span className="gold-label">{t('status_lookup_event')}</span>
                    <p className="text-sm font-medium text-temple-goldLight truncate">
                      {r.event_name}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                      r.status
                    )}`}
                  >
                    {t(`approval_${r.status.toLowerCase()}`)}
                  </span>
                </div>
                <p className="text-xs text-white/55">
                  {t('status_lookup_submitted')}: {formatSubmittedDate(r.submitted_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
