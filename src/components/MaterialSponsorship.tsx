import { useLanguage } from '@/lib/languageContext';
import MaterialProgress from './MaterialProgress';
import type { EventMaterial, SponsoredItem } from '@/types';

interface MaterialSponsorshipProps {
  materials: EventMaterial[];
  sponsored: SponsoredItem[];
  onChange: (sponsored: SponsoredItem[]) => void;
}

export default function MaterialSponsorship({ materials, sponsored, onChange }: MaterialSponsorshipProps) {
  const { t } = useLanguage();

  function updateQty(item: EventMaterial, qty: number) {
    const clamped = Math.max(0, Math.min(qty, item.target_quantity - item.qty_received));
    const existing = sponsored.find((s) => s.item_id === item.item_id);
    if (existing) {
      if (clamped === 0) {
        onChange(sponsored.filter((s) => s.item_id !== item.item_id));
      } else {
        onChange(
          sponsored.map((s) =>
            s.item_id === item.item_id ? { ...s, qty_given: clamped } : s
          )
        );
      }
    } else if (clamped > 0) {
      onChange([
        ...sponsored,
        {
          item_id: item.item_id,
          material_name: item.material_name,
          unit_type: item.unit_type,
          qty_given: clamped,
        },
      ]);
    }
  }

  function getSponsoredQty(itemId: string): number {
    return sponsored.find((s) => s.item_id === itemId)?.qty_given ?? 0;
  }

  if (materials.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-temple-goldLight">
        {t('step2_sponsor_title')}
      </h4>

      {materials.map((mat) => {
        const isFilled =
          mat.funding_status === 'Filled' || mat.qty_received >= mat.target_quantity;
        const sponsoredQty = getSponsoredQty(mat.item_id);
        const remaining = mat.target_quantity - mat.qty_received;

        return (
          <div
            key={mat.item_id}
            className={`p-3 rounded border transition-colors ${
              isFilled
                ? 'border-green-700/40 bg-green-950/20'
                : 'border-temple-gold/20 bg-temple-bg/50'
            }`}
          >
            <div className="mb-2">
              <MaterialProgress material={mat} />
            </div>

            {!isFilled && (
              <input
                type="number"
                min={0}
                max={remaining}
                value={sponsoredQty || ''}
                onChange={(e) => updateQty(mat, parseFloat(e.target.value) || 0)}
                placeholder={`0 ${mat.unit_type}`}
                className="w-full px-3 py-1.5 bg-temple-card border border-temple-gold/40 rounded text-white text-xs placeholder:text-white/25 focus:ring-1 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
