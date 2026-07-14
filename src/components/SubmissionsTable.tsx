import { useState } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { APPROVAL_STATES } from '@/config/admin';
import { buildWhatsAppMessage } from '@/config/whatsapp';
import type { DevoteeSubmission, Event } from '@/types';

interface SubmissionsTableProps {
  submissions: DevoteeSubmission[];
  events: Event[];
  loading: boolean;
  onUpdateApproval: (
    receiptId: string,
    status: 'Pending' | 'Approved' | 'Rejected'
  ) => Promise<DevoteeSubmission>;
}

function getEventName(eventId: string, events: Event[]): string {
  const e = events.find((ev) => ev.event_id === eventId);
  return e?.event_name ?? eventId.slice(0, 8);
}

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function SubmissionsTable({
  submissions,
  events,
  loading,
  onUpdateApproval,
}: SubmissionsTableProps) {
  const { t } = useLanguage();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleStatusChange(
    submission: DevoteeSubmission,
    newStatus: 'Pending' | 'Approved' | 'Rejected'
  ) {
    setUpdatingId(submission.receipt_id);
    try {
      await onUpdateApproval(submission.receipt_id, newStatus);
    } catch {
      // silently fail; revert handled by parent
    } finally {
      setUpdatingId(null);
    }
  }

  function copyWhatsAppLink(submission: DevoteeSubmission) {
    const event = events.find((e) => e.event_id === submission.event_id);
    if (!event) return;
    const url = buildWhatsAppMessage(submission, event);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(submission.receipt_id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  if (loading) {
    return (
      <p className="text-center text-temple-goldLight/40 text-sm animate-shimmer py-8">
        {t('admin_table_loading')}
      </p>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-temple-goldLight/40">{t('admin_no_submissions')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-temple-gold/20">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-temple-card text-temple-goldLight/70">
            <th className="text-left p-3 font-medium">{t('admin_event')}</th>
            <th className="text-left p-3 font-medium">{t('admin_name')}</th>
            <th className="text-left p-3 font-medium hidden sm:table-cell">
              {t('admin_whatsapp')}
            </th>
            <th className="text-left p-3 font-medium hidden md:table-cell">
              {t('admin_email')}
            </th>
            <th className="text-right p-3 font-medium">{t('admin_amount')}</th>
            <th className="text-center p-3 font-medium hidden lg:table-cell">
              {t('admin_proof')}
            </th>
            <th className="text-center p-3 font-medium">{t('admin_status')}</th>
            <th className="text-center p-3 font-medium">{t('admin_actions')}</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => {
            const event = events.find((e) => e.event_id === s.event_id);
            const statusCfg = APPROVAL_STATES[s.admin_approval];
            const isUpdating = updatingId === s.receipt_id;

            return (
              <tr
                key={s.receipt_id}
                className="border-t border-temple-gold/10 hover:bg-temple-gold/5 transition-colors"
              >
                <td className="p-3 text-white max-w-[100px] truncate">
                  {getEventName(s.event_id, events)}
                </td>
                <td className="p-3 text-white max-w-[120px] truncate">
                  {s.devotee_name}
                </td>
                <td className="p-3 text-temple-goldLight/60 hidden sm:table-cell">
                  {s.devotee_whatsapp}
                </td>
                <td className="p-3 text-temple-goldLight/60 hidden md:table-cell max-w-[140px] truncate">
                  {s.devotee_email}
                </td>
                <td className="p-3 text-temple-yellow font-bold text-right">
                  RM {s.total_amount_paid.toFixed(2)}
                </td>
                <td className="p-3 text-center hidden lg:table-cell">
                  {s.payment_proof ? (
                    <a
                      href={s.payment_proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-temple-gold hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-temple-goldLight/30">—</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      statusCfg.color ?? 'bg-gray-700 text-white'
                    }`}
                  >
                    {statusCfg.icon} {t(`approval_${s.admin_approval.toLowerCase()}`)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {s.admin_approval !== 'Approved' && (
                      <select
                        value={s.admin_approval}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleStatusChange(
                            s,
                            e.target.value as 'Pending' | 'Approved' | 'Rejected'
                          )
                        }
                        className="bg-temple-bg border border-temple-gold/40 rounded text-white text-[10px] px-1 py-1 outline-none"
                      >
                        <option value="Pending">{t('approval_pending')}</option>
                        <option value="Approved">{t('approval_approved')}</option>
                        <option value="Rejected">{t('approval_rejected')}</option>
                      </select>
                    )}

                    {event && (
                      <button
                        onClick={() => copyWhatsAppLink(s)}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                          copiedId === s.receipt_id
                            ? 'bg-green-600 border-green-500 text-white'
                            : 'text-green-400 border-green-700/40 hover:bg-green-950/30'
                        }`}
                      >
                        {copiedId === s.receipt_id ? 'Copied!' : 'WA'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
