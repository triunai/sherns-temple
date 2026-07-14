import { useLanguage } from '@/lib/languageContext';
import { TEMPLE_CONSTANTS } from '@/lib/constants';

interface VisualDarshanProps {
  className?: string;
}

export default function VisualDarshan({ className = '' }: VisualDarshanProps) {
  const { t } = useLanguage();

  return (
    <div className={`bg-temple-card/50 border border-temple-gold/20 rounded-lg p-3 ${className}`}>
      <p className="text-xs text-temple-goldLight/50 text-center mb-2">
        🛕 {TEMPLE_CONSTANTS.TEMPLE.NAME}
      </p>
      <div className="aspect-square bg-temple-bg rounded border border-temple-gold/30 flex items-center justify-center">
        <span className="text-6xl" aria-label="Temple Darshan">
          🛕
        </span>
      </div>
      <p className="text-[10px] text-temple-goldLight/30 text-center mt-2">
        3D Darshan — {t('lang_en')}
      </p>
    </div>
  );
}
