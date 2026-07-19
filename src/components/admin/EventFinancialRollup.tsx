import { useMemo, useState } from 'react';
import { useLanguage } from '@/lib/languageContext';
import type { DevoteeSubmission, Event, EventFinancialSummary } from '@/types';

interface Props {
  submissions: DevoteeSubmission[];
  events: Event[];
}

export default function EventFinancialRollup(props: Props) {
  const { submissions, events } = props;
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const summaries = useMemo<EventFinancialSummary[]>(() => {
    const nameById = new Map<string, string>();
    for (const event of events) {
      nameById.set(event.event_id, event.event_name);
    }

    const byEvent = new Map<string, EventFinancialSummary>();
    for (const submission of submissions) {
      const eventId = submission.event_id;
      let summary = byEvent.get(eventId);
      if (!summary) {
        summary = {
          event_id: eventId,
          event_name: nameById.get(eventId) ?? eventId.slice(0, 8),
          registrations: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          collected: 0,
          awaiting: 0,
        };
        byEvent.set(eventId, summary);
      }

      summary.registrations += 1;
      if (submission.admin_approval === 'Approved') {
        summary.approved += 1;
        summary.collected += submission.total_amount_paid;
      } else if (submission.admin_approval === 'Pending') {
        summary.pending += 1;
        summary.awaiting += submission.total_amount_paid;
      } else if (submission.admin_approval === 'Rejected') {
        summary.rejected += 1;
      }
    }

    return Array.from(byEvent.values())
      .filter((summary) => summary.registrations >= 1)
      .sort((a, b) => b.collected - a.collected || b.registrations - a.registrations);
  }, [submissions, events]);

  return (
    <section className="mb-6 animate-fade-in">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="btn-press w-full min-h-[44px] flex items-center justify-between gap-3 bg-temple-card border border-temple-gold/20 rounded-lg px-4 py-2 text-left"
      >
        <span className="gold-label">{t('rollup_title')}</span>
        <span className="flex items-center gap-2 text-xs text-temple-goldLight">
          {expanded ? t('rollup_hide') : t('rollup_show')}
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="mt-3 animate-scale-in">
          {summaries.length === 0 ? (
            <p className="text-sm text-temple-goldLight/60 px-1">{t('rollup_empty')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summaries.map((summary) => (
                <div
                  key={summary.event_id}
                  className="bg-temple-card border border-temple-gold/20 rounded-lg p-3"
                >
                  <div className="font-semibold text-temple-goldLight truncate">
                    {summary.event_name}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="text-temple-goldLight/70">
                      {t('rollup_registrations')}: {summary.registrations}
                    </span>
                    <span className="text-green-400">
                      {t('rollup_collected')}: {`RM ${summary.collected.toFixed(2)}`}
                    </span>
                    <span className="text-temple-yellow">
                      {t('rollup_awaiting')}: {`RM ${summary.awaiting.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
