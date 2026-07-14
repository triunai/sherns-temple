import { useLanguage } from '@/lib/languageContext';
import { TEMPLE_CONSTANTS } from '@/lib/constants';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-temple-gold/20 bg-temple-card/50 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-temple-goldLight/50 text-xs space-y-1">
        <p>
          🛕 {TEMPLE_CONSTANTS.TEMPLE.NAME}
        </p>
        <p>{t('footer_contact')} — {TEMPLE_CONSTANTS.PRIEST.WHATSAPP}</p>
        <p>&copy; {new Date().getFullYear()} {t('footer_rights')}</p>
      </div>
    </footer>
  );
}
