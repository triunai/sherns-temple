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

// Short titles for small screens (no app_title_short key exists in the
// language context, and this component must not modify other files).
const SHORT_TITLES: Record<Language, string> = {
  EN: 'Temple Bulletin',
  TA: 'கோயில் அறிக்கை',
  BM: 'Buletin Kuil',
};

export default function Header({ onAdminClick, isAdmin, userEmail }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-temple-bg/95 backdrop-blur border-b border-temple-gold/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Icon + title (short title on mobile, full on sm+) */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-temple-gold text-xl sm:text-2xl shrink-0" aria-hidden="true">
            🛕
          </span>
          <h1 className="text-sm sm:text-base font-semibold text-temple-goldLight tracking-wide truncate min-w-0">
            <span className="sm:hidden">{SHORT_TITLES[language] ?? 'Temple Bulletin'}</span>
            <span className="hidden sm:inline">{t('app_title')}</span>
          </h1>
        </div>

        {/* Language toggle + admin */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex rounded-lg overflow-hidden border border-temple-gold/40 bg-temple-card">
            {LANGUAGES.map((l) => (
              <button
                key={l.key}
                onClick={() => setLanguage(l.key)}
                aria-pressed={language === l.key}
                className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
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
              <span className="hidden md:inline text-xs text-temple-goldLight/40 max-w-[120px] truncate">
                {userEmail}
              </span>
            )}
            {/* Mobile: icon-only admin button */}
            <button
              onClick={onAdminClick}
              aria-label={isAdmin ? t('back_to_public') : t('admin_login')}
              title={isAdmin ? t('back_to_public') : t('admin_login')}
              className="sm:hidden flex items-center justify-center w-8 h-8 text-temple-goldLight/60 hover:text-temple-gold border border-temple-gold/30 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            {/* Desktop: text admin button */}
            <button
              onClick={onAdminClick}
              className="hidden sm:inline-block text-xs text-temple-goldLight/60 hover:text-temple-gold border border-temple-gold/30 rounded px-3 py-1 whitespace-nowrap transition-colors"
            >
              {isAdmin ? t('back_to_public') : t('admin_login')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
