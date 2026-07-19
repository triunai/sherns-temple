import { useLanguage } from '@/lib/languageContext';
import type { EventMaterial } from '@/types';

interface MaterialProgressProps {
  material: EventMaterial;
  compact?: boolean;
}

export default function MaterialProgress({ material, compact = false }: MaterialProgressProps) {
  const { t } = useLanguage();

  const { material_name, target_quantity, unit_type, qty_received, funding_status } = material;

  const isFilled = funding_status === 'Filled' || qty_received >= target_quantity;

  const rawPercent = target_quantity > 0 ? (qty_received / target_quantity) * 100 : 0;
  const percent = Math.min(100, Math.max(0, rawPercent));
  const barWidth = isFilled ? 100 : percent;

  const progressText = `${qty_received} / ${target_quantity} ${unit_type} ${t('material_sponsored_suffix')}`;

  const nameSize = compact ? 'text-[11px]' : 'text-sm';
  const metaSize = compact ? 'text-[11px]' : 'text-xs';
  const trackHeight = compact ? 'h-1.5' : 'h-2';
  const rowGap = compact ? 'mb-1' : 'mb-1.5';

  return (
    <div className="animate-fade-in">
      <div className={`flex items-center justify-between gap-2 ${rowGap}`}>
        <span className={`${nameSize} font-medium text-white truncate`}>{material_name}</span>

        {isFilled ? (
          <span
            className={`${metaSize} font-semibold rounded-full bg-green-600 px-2 py-0.5 text-white shrink-0 animate-scale-in`}
          >
            {t('material_filled')}
          </span>
        ) : (
          <span className={`${metaSize} text-temple-goldLight shrink-0`}>{progressText}</span>
        )}
      </div>

      <div className={`${trackHeight} w-full overflow-hidden rounded-full bg-temple-bg`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFilled ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gold-gradient'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
