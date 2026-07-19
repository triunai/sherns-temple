import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/languageContext';

interface ReceiptThumbnailProps {
  url: string;
  label?: string;
}

/**
 * Decide whether a URL points at an image we can render inline.
 * - true when it ends in a known image extension, or has no file extension
 *   at all (Supabase public storage URLs frequently omit one).
 * - false when it clearly ends in a non-image extension (e.g. `.pdf`).
 */
function looksLikeImage(u: string): boolean {
  if (/\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?|#|$)/i.test(u)) return true;
  const path = u.split(/[?#]/)[0];
  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  const hasExtension = /\.[a-z0-9]{1,8}$/i.test(lastSegment);
  // No extension → assume image; any other extension → not an image.
  return !hasExtension;
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function ReceiptThumbnail({ url, label }: ReceiptThumbnailProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const src = (url ?? '').trim();
  const isImage = src !== '' && looksLikeImage(src);
  const altText = label && label.trim() !== '' ? label : t('receipt_view');

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Empty URL — disabled "unavailable" chip.
  if (src === '') {
    return (
      <span
        className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-temple-gold/20 bg-temple-card text-xs text-temple-goldLight/40 cursor-not-allowed select-none animate-fade-in"
        aria-disabled="true"
      >
        <DocumentIcon />
        {t('receipt_unavailable')}
      </span>
    );
  }

  // Image failed to load — show fallback with an open-in-new-tab escape hatch.
  if (isImage && imgFailed) {
    return (
      <div className="inline-flex flex-col items-start gap-1 animate-fade-in">
        <span className="text-xs text-temple-goldLight/50">{t('receipt_unavailable')}</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-temple-gold/30 bg-temple-card text-xs text-temple-gold btn-press"
        >
          <ExternalIcon />
          {t('receipt_open_new')}
        </a>
      </div>
    );
  }

  // Not an image (e.g. PDF) — compact link button.
  if (!isImage) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-temple-gold/30 bg-temple-card text-xs text-temple-gold btn-press animate-fade-in"
      >
        <DocumentIcon />
        {t('receipt_open_new')}
      </a>
    );
  }

  // Image — tappable thumbnail that opens a lightbox.
  return (
    <>
      <div className="inline-flex flex-col items-center gap-1 animate-fade-in">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={altText}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg btn-press focus:outline-none focus:ring-2 focus:ring-temple-gold/60"
        >
          <img
            src={src}
            alt={altText}
            onError={() => setImgFailed(true)}
            className="w-16 h-16 object-cover rounded border border-temple-gold/30"
          />
        </button>
        <span className="text-xs text-temple-goldLight/60">{t('receipt_tap_enlarge')}</span>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-scale-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={altText}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute top-4 right-4 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg border border-temple-gold/30 bg-temple-card text-sm text-temple-gold btn-press"
          >
            <CloseIcon />
            {t('receipt_close')}
          </button>

          <div
            className="flex flex-col items-center gap-3 max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={altText}
              onError={() => {
                setImgFailed(true);
                setOpen(false);
              }}
              className="max-h-[85vh] max-w-full object-contain rounded shadow-gold-elevate"
            />
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg border border-temple-gold/30 bg-temple-card text-sm text-temple-gold btn-press"
            >
              <ExternalIcon />
              {t('receipt_open_new')}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
