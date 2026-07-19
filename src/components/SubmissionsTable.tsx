import { useMemo, useState } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { APPROVAL_STATES } from '@/config/admin';
import { buildWhatsAppMessage } from '@/config/whatsapp';
import { exportSubmissionsCsv } from '@/lib/csvExport';
import type { ApprovalStatus, DevoteeSubmission, Event } from '@/types';

interface SubmissionsTableProps {
  submissions: DevoteeSubmission[];
  events: Event[];
  loading: boolean;
  onUpdateApproval: (
    receiptId: string,
    status: 'Pending' | 'Approved' | 'Rejected'
  ) => Promise<DevoteeSubmission>;
}

type StatusFilter = 'All' | ApprovalStatus;

function formatSubmittedAt(dt: string): string {
  return new Date(dt).toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SubmissionCardProps {
  submission: DevoteeSubmission;
  event: Event | undefined;
  onUpdateApproval: SubmissionsTableProps['onUpdateApproval'];
}

function SubmissionCard({ submission, event, onUpdateApproval }: SubmissionCardProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusCfg = APPROVAL_STATES[submission.admin_approval];
  const eventName = event?.event_name ?? submission.event_id.slice(0, 8);

  async function handleStatusChange(status: 'Pending' | 'Approved' | 'Rejected') {
    setUpdating(true);
    try {
      await onUpdateApproval(submission.receipt_id, status);
    } catch {
      // silently fail; revert/toast handled by parent
    } finally {
      setUpdating(false);
    }
  }

  function handleCopyWhatsApp() {
    if (!event) return;
    const msg = buildWhatsAppMessage(submission, event);
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-temple-card border border-temple-gold/20 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] text-temple-goldLight/50 truncate">{eventName}</p>
          <h3 className="text-sm font-bold text-white truncate">{submission.devotee_name}</h3>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
            statusCfg.color ?? 'bg-gray-700 text-white'
          }`}
        >
          {statusCfg.icon} {t(`approval_${submission.admin_approval.toLowerCase()}`)}
        </span>
      </div>

      {/* Contact info */}
      <div className="space-y-0.5 text-xs text-temple-goldLight/70">
        <p className="truncate">{submission.devotee_whatsapp}</p>
        <p className="truncate">{submission.devotee_email}</p>
      </div>

      {/* Amount + submitted date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-temple-yellow font-bold text-sm">
          RM {submission.total_amount_paid.toFixed(2)}
        </span>
        <span className="text-temple-goldLight/40 text-[11px]">
          {t('admin_submitted_at')}: {formatSubmittedAt(submission.created_at)}
        </span>
      </div>
      <p className="text-[10px] text-temple-goldLight/30">
        {t('admin_ref')} {submission.receipt_id.slice(0, 8)}
      </p>

      {/* Details toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-[11px] font-medium text-temple-gold hover:underline min-h-[44px] flex items-center"
      >
        {expanded ? t('admin_hide_details') : t('admin_view_details')}
      </button>

      {expanded && (
        <div className="border-t border-temple-gold/10 pt-3 space-y-2 text-xs text-temple-goldLight/70">
          <p>
            <span className="text-temple-goldLight/50">{t('admin_natchatram')}: </span>
            {submission.primary_natchatram || t('admin_none_provided')}
          </p>
          <p>
            <span className="text-temple-goldLight/50">{t('admin_rasi')}: </span>
            {submission.primary_rasi || '—'}
          </p>

          {submission.family_json.length > 0 && (
            <div>
              <p className="text-temple-goldLight/50 mb-1">{t('admin_family')}:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {submission.family_json.map((m, i) => (
                  <li key={i}>
                    {m.name} — {m.natchatram} / {m.rasi}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submission.sponsored_items.length > 0 && (
            <div>
              <p className="text-temple-goldLight/50 mb-1">{t('admin_materials')}:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {submission.sponsored_items.map((item) => (
                  <li key={item.item_id}>
                    {item.material_name}: {item.qty_given} {item.unit_type}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submission.payment_proof && (
            <a
              href={submission.payment_proof}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-temple-gold hover:underline"
            >
              View receipt
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {submission.admin_approval !== 'Approved' && (
          <button
            onClick={() => handleStatusChange('Approved')}
            disabled={updating}
            className="min-h-[44px] px-3 rounded-lg border border-green-700/40 text-green-400 text-xs font-medium hover:bg-green-950/30 disabled:opacity-50 transition-colors"
          >
            {t('admin_approve')}
          </button>
        )}
        {submission.admin_approval !== 'Rejected' && (
          <button
            onClick={() => handleStatusChange('Rejected')}
            disabled={updating}
            className="min-h-[44px] px-3 rounded-lg border border-red-700/40 text-red-400 text-xs font-medium hover:bg-red-950/30 disabled:opacity-50 transition-colors"
          >
            {t('admin_reject')}
          </button>
        )}
        {submission.admin_approval !== 'Pending' && (
          <button
            onClick={() => handleStatusChange('Pending')}
            disabled={updating}
            className="min-h-[44px] px-3 rounded-lg border border-temple-gold/40 text-temple-goldLight/70 text-xs font-medium hover:bg-temple-gold/10 disabled:opacity-50 transition-colors"
          >
            {t('admin_mark_pending')}
          </button>
        )}
        {event && (
          <button
            onClick={handleCopyWhatsApp}
            className={`min-h-[44px] px-3 rounded-lg border text-xs font-medium transition-colors ${
              copied
                ? 'bg-green-600 border-green-500 text-white'
                : 'text-green-400 border-green-700/40 hover:bg-green-950/30'
            }`}
          >
            {copied ? t('admin_copied') : t('admin_copy_wa')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SubmissionsTable({
  submissions,
  events,
  loading,
  onUpdateApproval,
}: SubmissionsTableProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const filteredSubmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter !== 'All' && s.admin_approval !== statusFilter) return false;
      if (!q) return true;
      return (
        s.devotee_name.toLowerCase().includes(q) ||
        s.devotee_whatsapp.toLowerCase().includes(q) ||
        s.devotee_email.toLowerCase().includes(q)
      );
    });
  }, [submissions, search, statusFilter]);

  if (loading) {
    return (
      <p className="text-center text-temple-goldLight/40 text-sm animate-shimmer py-8">
        {t('admin_table_loading')}
      </p>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <span className="text-4xl block">🛕</span>
        <p className="text-temple-goldLight/60 font-medium">{t('admin_no_submissions')}</p>
        <p className="text-temple-goldLight/30 text-xs">{t('admin_no_submissions_hint')}</p>
      </div>
    );
  }

  const filterChips: { key: StatusFilter; label: string }[] = [
    { key: 'All', label: t('admin_filter_all') },
    { key: 'Pending', label: t('approval_pending') },
    { key: 'Approved', label: t('approval_approved') },
    { key: 'Rejected', label: t('approval_rejected') },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin_search_placeholder')}
          className="w-full min-h-[44px] px-3 rounded-lg bg-temple-bg border border-temple-gold/20 text-white text-sm placeholder:text-temple-goldLight/30 outline-none focus:border-temple-gold/50 transition-colors"
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[44px] ${
                  statusFilter === chip.key
                    ? 'bg-temple-gold/20 border-temple-gold text-temple-gold'
                    : 'border-temple-gold/20 text-temple-goldLight/60 hover:bg-temple-gold/5'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportSubmissionsCsv(filteredSubmissions, events)}
            className="min-h-[44px] px-3 rounded-lg border border-temple-gold/40 text-temple-gold text-xs font-medium hover:bg-temple-gold/10 transition-colors whitespace-nowrap"
          >
            {t('admin_export_csv')}
          </button>
        </div>

        <p className="text-[11px] text-temple-goldLight/40">
          {filteredSubmissions.length} / {submissions.length}
        </p>
      </div>

      {/* Card list */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-temple-goldLight/40 text-sm">{t('admin_no_results')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((s) => (
            <SubmissionCard
              key={s.receipt_id}
              submission={s}
              event={events.find((e) => e.event_id === s.event_id)}
              onUpdateApproval={onUpdateApproval}
            />
          ))}
        </div>
      )}
    </div>
  );
}
