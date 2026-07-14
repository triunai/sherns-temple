import { useState, useRef } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { db } from '@/lib/db';

interface PaymentProofUploadProps {
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

export default function PaymentProofUpload({ onUploaded, disabled }: PaymentProofUploadProps) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setFileName(file.name);
    setUploading(true);
    try {
      const url = await db.storage.uploadPaymentProof(file);
      setPreviewUrl(url);
      onUploaded(url);
    } catch {
      setFileName(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-temple-goldLight">
        {t('step2_upload_receipt')}
        <span className="text-temple-crimson ml-1">*</span>
      </label>

      <div
        onClick={() => !disabled && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          previewUrl
            ? 'border-green-600/50 bg-green-950/10'
            : disabled
              ? 'border-temple-gold/20 bg-temple-bg/30 cursor-not-allowed'
              : 'border-temple-gold/40 bg-temple-card hover:border-temple-gold/70'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <p className="text-temple-gold text-sm animate-shimmer">
            {t('form_loading')}
          </p>
        ) : previewUrl ? (
          <div className="space-y-2">
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="max-h-32 mx-auto rounded border border-temple-gold/30 object-cover"
            />
            <p className="text-green-400 text-xs">{t('step2_file_selected')}: {fileName}</p>
          </div>
        ) : (
          <p className="text-temple-goldLight/40 text-xs">{t('step2_drag_drop')}</p>
        )}
      </div>
    </div>
  );
}
