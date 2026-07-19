import { useLanguage } from '@/lib/languageContext';
import type { FamilyMember } from '@/types';
import { NATCHATRAM_LIST } from '@/config/natchatram';
import { RASI_LIST } from '@/config/rasi';

interface SankalpamFormProps {
  members: FamilyMember[];
  onChange: (members: FamilyMember[]) => void;
}

function emptyMember(): FamilyMember {
  return { name: '', natchatram: '', rasi: '' };
}

export default function SankalpamForm({ members, onChange }: SankalpamFormProps) {
  const { language, t } = useLanguage();

  function addMember() {
    onChange([...members, emptyMember()]);
  }

  function removeMember(index: number) {
    onChange(members.filter((_, i) => i !== index));
  }

  function updateMember(index: number, field: keyof FamilyMember, value: string) {
    onChange(members.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-temple-goldLight">
        {t('step2_family_title')}
      </h4>

      {members.map((member, idx) => (
        <div
          key={idx}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-end p-3 bg-temple-bg/50 rounded-lg border border-temple-gold/20 animate-fade-in"
        >
          <div className="sm:col-span-4">
            <label className="block text-xs text-temple-goldLight/60 mb-1">
              {t('step2_family_name')}
            </label>
            <input
              type="text"
              value={member.name}
              onChange={(e) => updateMember(idx, 'name', e.target.value)}
              placeholder={t('step2_family_name')}
              className="w-full min-h-[44px] px-3 py-2 bg-temple-card border border-temple-gold/40 rounded-lg text-white text-base sm:text-sm placeholder:text-white/25 focus:ring-1 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs text-temple-goldLight/60 mb-1">
              {t('contact_natchatram')}
            </label>
            <select
              value={member.natchatram}
              onChange={(e) => updateMember(idx, 'natchatram', e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-temple-card border border-temple-gold/40 rounded-lg text-white text-base sm:text-sm focus:ring-1 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
            >
              <option value="">--</option>
              {NATCHATRAM_LIST.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.labels[language] ?? n.value}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs text-temple-goldLight/60 mb-1">
              {t('contact_rasi')}
            </label>
            <select
              value={member.rasi}
              onChange={(e) => updateMember(idx, 'rasi', e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-temple-card border border-temple-gold/40 rounded-lg text-white text-base sm:text-sm focus:ring-1 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
            >
              <option value="">--</option>
              {RASI_LIST.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.labels[language] ?? r.value}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => removeMember(idx)}
              className="w-full min-h-[44px] py-2 text-xs text-red-400 hover:text-red-300 border border-red-800/50 hover:border-red-600/50 rounded-lg transition-colors"
              aria-label={t('step2_family_remove')}
            >
              <span className="sm:hidden">✕ {t('step2_family_remove')}</span>
              <span className="hidden sm:inline">✕</span>
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addMember}
        className="w-full min-h-[44px] py-2 text-xs font-medium text-temple-gold border border-dashed border-temple-gold/40 rounded-lg hover:bg-temple-gold/5 transition-colors"
      >
        {t('step2_family_add')}
      </button>
    </div>
  );
}
