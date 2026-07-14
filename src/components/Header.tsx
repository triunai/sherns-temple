import { useLanguage } from '@/lib/languageContext';
import type { Language } from '@/types';

interface HeaderProps {
  onAdminClick: () => void;
  isAdmin: boolean;
  userEmail?: string | null;
}

const LANGUAGES: { key: Language; labelKey: string }[] = [
  { key: 'EN', labelKey: 'lang_en' },
  { key: 'TA', labelKey: 'lang_ta' },
  { key: 'BM', labelKey: 'lang_bm' },
];

export default function Header({ onAdminClick, isAdmin, userEmail }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-temple-bg/95 backdrop-blur border-b border-temple-gold/30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-temple-gold text-2xl" aria-hidden="true">
            🛕
          </span>
          <h1 className="text-sm sm:text-base font-semibold text-temple-goldLight tracking-wide">
            {t('app_title')}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-temple-gold/40 bg-temple-card">
            {LANGUAGES.map((l) => (
              <button
                key={l.key}
                onClick={() => setLanguage(l.key)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  language === l.key
                    ? 'bg-temple-gold text-black'
                    : 'text-temple-goldLight/70 hover:text-temple-goldLight'
                }`}
              >
                {t(l.labelKey)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && userEmail && (
              <span className="hidden sm:inline text-xs text-temple-goldLight/40 max-w-[120px] truncate">
                {userEmail}
              </span>
            )}
            <button
              onClick={onAdminClick}
              className="text-xs text-temple-goldLight/60 hover:text-temple-gold border border-temple-gold/30 rounded px-3 py-1 transition-colors"
            >
              {isAdmin ? t('back_to_public') : t('admin_login')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
