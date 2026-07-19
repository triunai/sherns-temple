import { useLanguage } from '@/lib/languageContext';
import type { FormFieldConfig } from '@/types';
import { NATCHATRAM_LIST } from '@/config/natchatram';
import { RASI_LIST } from '@/config/rasi';

interface FormFieldProps {
  field: FormFieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

function renderDropdown(
  optionsSource: string,
  value: string,
  onChange: (value: string) => void,
  language: string
) {
  let list: { value: string; labels: Record<string, string> }[] = [];

  if (optionsSource === 'natchatram') list = NATCHATRAM_LIST;
  else if (optionsSource === 'rasi') list = RASI_LIST;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[44px] px-3 py-2.5 bg-temple-bg border border-temple-gold/40 rounded-lg text-white text-base sm:text-sm focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
    >
      <option value="">--</option>
      {list.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.labels[language] ?? opt.value}
        </option>
      ))}
    </select>
  );
}

export default function FormField({ field, value, onChange, error }: FormFieldProps) {
  const { language, t } = useLanguage();

  const label = t(field.label);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-temple-goldLight/80">
        {label}
        {field.required && <span className="text-temple-crimson ml-1">*</span>}
      </label>

      {field.type === 'dropdown' && field.optionsSource ? (
        renderDropdown(field.optionsSource, value, onChange, language)
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ? t(field.placeholder) : undefined}
          required={field.required}
          className={`w-full min-h-[44px] px-3 py-2.5 bg-temple-bg border rounded-lg text-white text-base sm:text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none ${
            error ? 'border-red-500/70' : 'border-temple-gold/40'
          }`}
        />
      )}

      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1" role="alert">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
