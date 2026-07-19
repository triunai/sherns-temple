import { useLanguage } from '@/lib/languageContext';
import type { SubmissionStats } from '@/types';

interface StatsCardsProps {
  stats: SubmissionStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useLanguage();

  const cards: { key: string; label: string; value: string; colorClass: string }[] = [
    {
      key: 'total',
      label: t('admin_stat_total'),
      value: String(stats.total),
      colorClass: 'text-temple-goldLight',
    },
    {
      key: 'pending',
      label: t('admin_stat_pending'),
      value: String(stats.pending),
      colorClass: 'text-temple-yellow',
    },
    {
      key: 'approved',
      label: t('admin_stat_approved'),
      value: String(stats.approved),
      colorClass: 'text-green-400',
    },
    {
      key: 'rejected',
      label: t('admin_stat_rejected'),
      value: String(stats.rejected),
      colorClass: 'text-red-400',
    },
    {
      key: 'collected',
      label: t('admin_stat_collected'),
      value: `RM ${stats.collected.toFixed(2)}`,
      colorClass: 'text-temple-gold',
    },
    {
      key: 'awaiting',
      label: t('admin_stat_awaiting'),
      value: `RM ${stats.awaiting.toFixed(2)}`,
      colorClass: 'text-temple-gold',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-temple-card border border-temple-gold/20 rounded-lg p-3 text-center"
        >
          <div className={`text-lg sm:text-xl font-bold leading-tight ${card.colorClass}`}>
            {card.value}
          </div>
          <div className="text-[11px] text-temple-goldLight/60 mt-1 truncate">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
