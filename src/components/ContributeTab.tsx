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
            className="w-full min-h-[44px] py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors"
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
            <p className="text-red-400 text-xs flex items-center gap-1" role="alert">
              <span aria-hidden="true">⚠</span> {fieldErrors.payment_proof}
            </p>
          )}

          <div className="bg-temple-bg/50 border border-temple-gold/20 rounded-lg p-3 space-y-1.5 text-sm">
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
            <div className="flex justify-between font-bold text-temple-goldLight border-t border-temple-gold/20 pt-1.5">
              <span>{t('step2_total_grand')}</span>
              <span className="text-temple-yellow">RM {totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors disabled:opacity-50"
          >
            {submitting ? t('form_loading') : t('step2_submit')}
          </button>

          {submitError && (
            <p className="text-red-400 text-xs text-center bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2" role="alert">
              {submitError}
            </p>
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
              className="inline-flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-6 rounded-lg font-semibold text-sm bg-green-600 text-white border border-green-500 hover:bg-green-700 transition-colors"
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
    { step: 1 as Step, labelKey: 'step_short_1' },
    { step: 2 as Step, labelKey: 'step_short_2' },
    { step: 3 as Step, labelKey: 'step_short_3' },
  ];

  return (
    <div className="flex items-center" aria-label="Progress">
      {steps.map((s, idx) => {
        const isActive = current === s.step;
        const isDone = current > s.step;
        return (
          <div key={s.step} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => onChange(s.step)}
              aria-current={isActive ? 'step' : undefined}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] py-1 px-1 group"
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                  isActive
                    ? 'bg-temple-gold text-black border-temple-gold shadow-[0_0_10px_rgba(229,169,59,0.4)]'
                    : isDone
                      ? 'bg-temple-gold/20 text-temple-goldLight border-temple-gold/40'
                      : 'bg-temple-bg/50 text-temple-goldLight/40 border-temple-gold/15'
                }`}
              >
                {isDone ? '✓' : s.step}
              </span>
              <span
                className={`text-[10px] leading-none font-medium transition-colors ${
                  isActive
                    ? 'text-temple-gold'
                    : isDone
                      ? 'text-temple-goldLight/70'
                      : 'text-temple-goldLight/40'
                }`}
              >
                {t(s.labelKey)}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <span
                className={`flex-1 h-px mx-1 -mt-4 ${
                  current > s.step ? 'bg-temple-gold/50' : 'bg-temple-gold/15'
                }`}
              />
            )}
          </div>
        );
      })}
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
