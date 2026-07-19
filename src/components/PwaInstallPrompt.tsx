import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/languageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function PwaInstallPrompt() {
  const { t } = useLanguage();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setPromptEvent(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (!promptEvent || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] animate-scale-in">
      <div className="flex items-center gap-2 bg-temple-card border border-temple-gold/40 shadow-gold-elevate rounded-full px-4 py-1.5">
        <button
          type="button"
          onClick={handleInstall}
          className="btn-press flex items-center gap-2 min-h-[44px] px-2 text-sm font-semibold text-temple-goldLight"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 shrink-0"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          <span className="flex flex-col items-start leading-tight text-left">
            <span>{t('pwa_install')}</span>
            <span className="text-[10px] font-normal text-temple-goldLight/60 hidden sm:block">
              {t('pwa_install_hint')}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t('pwa_install_dismiss')}
          title={t('pwa_install_dismiss')}
          className="btn-press min-h-[44px] min-w-[44px] flex items-center justify-center text-lg text-temple-goldLight/50 hover:text-temple-goldLight transition-colors"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
