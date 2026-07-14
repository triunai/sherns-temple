import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { TEMPLE_CONSTANTS } from '@/lib/constants';
import { useEventMaterials } from '@/hooks/useEventMaterials';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { isEnabled } from '@/config/features';
import { CONTACT_FIELDS, VALIDATION_RULES } from '@/config/forms';
import { buildWhatsAppMessage } from '@/config/whatsapp';
import FormField from './FormField';
import SankalpamForm from './SankalpamForm';
import MaterialSponsorship from './MaterialSponsorship';
import PaymentProofUpload from './PaymentProofUpload';
import type { Event, FamilyMember, SponsoredItem } from '@/types';

interface ContributeTabProps {
  event: Event;
}

type Step = 1 | 2 | 3;

export default function ContributeTab({ event }: ContributeTabProps) {
  const { t } = useLanguage();
  const { materials } = useEventMaterials(event.event_id);
  const { submit, submitting, error: submitError, result } = useFormSubmit();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Record<string, string>>({});
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [sponsored, setSponsored] = useState<SponsoredItem[]>([]);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const showSponsorship = isEnabled('ENABLE_MATERIAL_SPONSORSHIP');
  const showFamily = isEnabled('ENABLE_FAMILY_MEMBERS');
  const showUpload = isEnabled('ENABLE_UPLOAD_RECEIPT');
  const requireProof = isEnabled('REQUIRE_PAYMENT_PROOF');

  const totals = useMemo(() => {
    const base = event.cost_per_pax ?? 0;
    const sponsorshipTotal = sponsored.reduce((sum, s) => sum + s.qty_given * 0, 0);
    return {
      baseFee: base,
      sponsorshipTotal,
      grandTotal: base + sponsorshipTotal,
    };
  }, [event.cost_per_pax, sponsored]);

  function validateFields(): boolean {
    const errors: Record<string, string> = {};
    for (const field of CONTACT_FIELDS) {
      if (!field.visible) continue;
      if (field.required && !form[field.key]?.trim()) {
        errors[field.key] = t('form_required');
      }
      if (form[field.key] && VALIDATION_RULES[field.key]) {
        const rule = VALIDATION_RULES[field.key];
        if (!rule.pattern.test(form[field.key])) {
          errors[field.key] = t(rule.messageKey);
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateFields()) return;
    if (requireProof && !paymentProofUrl) {
      setFieldErrors((prev) => ({ ...prev, payment_proof: t('form_required') }));
      return;
    }

    await submit({
      event_id: event.event_id,
      devotee_name: form.devotee_name || '',
      devotee_whatsapp: form.devotee_whatsapp || '',
      devotee_email: form.devotee_email || '',
      primary_natchatram: form.primary_natchatram || null,
      primary_rasi: form.primary_rasi || null,
      family_json: family,
      sponsored_items: sponsored,
      total_amount_paid: totals.grandTotal,
      payment_proof: paymentProofUrl,
    });

    setStep(3);
  }

  const isApproved = result?.admin_approval === 'Approved';
  const whatsappUrl = result && isApproved
    ? buildWhatsAppMessage(result, event)
    : null;

  return (
    <div className="space-y-4 pt-2 border-t border-temple-gold/20">
      <StepIndicator current={step} onChange={setStep} />

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h4 className="text-sm font-semibold text-temple-goldLight">
            {t('step1_title')}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <DetailRow label={t('step1_bank_label')} value={TEMPLE_CONSTANTS.BANK_DETAILS.BANK_NAME} />
              <DetailRow label={t('step1_account_label')} value={TEMPLE_CONSTANTS.BANK_DETAILS.ACCOUNT_NAME} />
              <DetailRow label={t('step1_number_label')} value={TEMPLE_CONSTANTS.BANK_DETAILS.ACCOUNT_NUMBER} />
              <DetailRow
                label={t('step1_cost_label')}
                value={`RM ${event.cost_per_pax.toFixed(2)}`}
                highlight
              />
            </div>

            <div className="bg-temple-bg/50 border border-temple-gold/30 rounded-lg p-3 flex flex-col items-center">
              <p className="text-xs text-temple-goldLight/70 mb-2 text-center">
                {t('step1_scan_qr')}
              </p>
              <img
                src={TEMPLE_CONSTANTS.BANK_DETAILS.QR_ASSET_URL}
                alt="DuitNow QR Code"
                className="w-32 h-32 object-contain bg-white rounded p-1"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = 'none';
                  el.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-32 h-32 bg-temple-card border border-temple-gold/20 rounded flex items-center justify-center">
                <span className="text-xs text-temple-goldLight/40">QR</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-2.5 rounded font-semibold text-sm bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors"
          >
            {t('step2_next')}
          </button>
        </div>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4 animate-fade-in"
        >
          <h4 className="text-sm font-semibold text-temple-goldLight">
            {t('step2_title')}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONTACT_FIELDS.filter((f) => f.visible).map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={form[field.key] || ''}
                onChange={(v) => setForm((prev) => ({ ...prev, [field.key]: v }))}
                error={fieldErrors[field.key]}
              />
            ))}
          </div>

          {showFamily && (
            <SankalpamForm members={family} onChange={setFamily} />
          )}

          {showSponsorship && (
            <MaterialSponsorship
              materials={materials}
              sponsored={sponsored}
              onChange={setSponsored}
            />
          )}

          {showUpload && (
            <PaymentProofUpload
              onUploaded={setPaymentProofUrl}
              disabled={submitting}
            />
          )}
          {fieldErrors.payment_proof && (
            <p className="text-red-400 text-xs">{fieldErrors.payment_proof}</p>
          )}

          <div className="bg-temple-bg/50 border border-temple-gold/20 rounded p-3 space-y-1 text-xs">
            <div className="flex justify-between text-temple-goldLight/70">
              <span>{t('step2_total_base')}</span>
              <span>RM {totals.baseFee.toFixed(2)}</span>
            </div>
            {totals.sponsorshipTotal > 0 && (
              <div className="flex justify-between text-temple-goldLight/70">
                <span>{t('step2_total_sponsor')}</span>
                <span>RM {totals.sponsorshipTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-temple-goldLight border-t border-temple-gold/20 pt-1">
              <span>{t('step2_total_grand')}</span>
              <span className="text-temple-yellow">RM {totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded font-semibold text-sm bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors disabled:opacity-50"
          >
            {submitting ? t('form_loading') : t('step2_submit')}
          </button>

          {submitError && (
            <p className="text-red-400 text-xs text-center">{submitError}</p>
          )}
        </form>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in text-center">
          <h4 className="text-sm font-bold text-temple-goldLight">
            {isApproved ? t('step3_approved_title') : t('step3_pending_title')}
          </h4>

          <p className="text-xs text-temple-goldLight/70">
            {isApproved ? t('step3_whatsapp_unlocked') : t('step3_pending_body')}
          </p>

          {isApproved && whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded font-semibold text-sm bg-green-600 text-white border border-green-500 hover:bg-green-700 transition-colors"
            >
              <span className="text-base">💬</span>
              {t('step3_whatsapp_btn')}
            </a>
          )}

          {!isApproved && result && (
            <div className="bg-temple-bg/50 border border-temple-gold/20 rounded p-3">
              <p className="text-xs text-temple-goldLight/40">
                Ref: {result.receipt_id}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepIndicator({
  current,
  onChange,
}: {
  current: Step;
  onChange: (s: Step) => void;
}) {
  const { t } = useLanguage();

  const steps = [
    { step: 1 as Step, labelKey: 'step1_title' },
    { step: 2 as Step, labelKey: 'step2_title' },
    { step: 3 as Step, labelKey: 'step3_title' },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, idx) => (
        <div key={s.step} className="flex items-center gap-1 flex-1">
          <button
            type="button"
            onClick={() => onChange(s.step)}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
              current === s.step
                ? 'bg-temple-gold text-black'
                : current > s.step
                  ? 'bg-temple-gold/20 text-temple-goldLight/70'
                  : 'bg-temple-bg/50 text-temple-goldLight/40'
            }`}
          >
            {t(s.labelKey)}
          </button>
          {idx < steps.length - 1 && (
            <span className="text-temple-goldLight/20 text-xs">›</span>
          )}
        </div>
      ))}
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline bg-temple-bg/50 rounded px-3 py-2 border border-temple-gold/10">
      <span className="text-xs text-temple-goldLight/60">{label}</span>
      <span
        className={`text-sm font-medium ${
          highlight ? 'text-temple-yellow font-bold' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
