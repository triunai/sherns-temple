import type { DevoteeSubmission, Event, SponsoredItem, FamilyMember } from '@/types';
import { TEMPLE_CONSTANTS } from '@/lib/constants';

function buildSankalpamLines(primaryName: string, primaryNatchatram: string | null, primaryRasi: string | null, family: FamilyMember[]): string {
  const lines: string[] = [];
  lines.push(`- 1. ${primaryName}${primaryNatchatram ? ` (${primaryNatchatram}` : ''}${primaryNatchatram && primaryRasi ? ` / ${primaryRasi})` : primaryRasi ? ` (${primaryRasi})` : ''}`);
  family.forEach((m, i) => {
    lines.push(`- ${i + 2}. ${m.name}${m.natchatram ? ` (${m.natchatram}` : ''}${m.natchatram && m.rasi ? ` / ${m.rasi})` : m.rasi ? ` (${m.rasi})` : ''}`);
  });
  return lines.join('\n');
}

function buildMaterialLines(items: SponsoredItem[]): string {
  return items.map(i => `- ${i.material_name}: ${i.qty_given} ${i.unit_type}`).join('\n');
}

export function buildWhatsAppMessage(submission: DevoteeSubmission, event: Event): string {
  const msg = [
    `🛕 *Temple Prayer & Material Sponsorship* 🛕`,
    `----------------------------------------`,
    `*Event:* ${event.event_name}`,
    `*Reference ID:* ${submission.receipt_id}`,
    ``,
    `📋 *Sankalpam Details:*`,
    buildSankalpamLines(
      submission.devotee_name,
      submission.primary_natchatram,
      submission.primary_rasi,
      submission.family_json
    ),
    ``,
    `🎁 *Material Contributions Sponsored:*`,
    buildMaterialLines(submission.sponsored_items),
    ``,
    `💰 *Payment Details:*`,
    `- Amount Transferred: RM ${submission.total_amount_paid.toFixed(2)}`,
    `- Verification Status: Verified & Confirmed by Admin`,
    ``,
    `📎 _Please attach your payment screenshot along with this message._`,
    `----------------------------------------`,
  ].join('\n');

  return `https://wa.me/${TEMPLE_CONSTANTS.PRIEST.WHATSAPP.replace('+', '')}?text=${encodeURIComponent(msg)}`;
}

export function buildWhatsAppUrl(
  eventName: string,
  receiptId: string,
  devoteeName: string,
  natchatram: string | null,
  rasi: string | null,
  totalPaid: number
): string {
  const msg = [
    encodeURIComponent(`🛕 *Temple Registration*\n`),
    encodeURIComponent(`Event: ${eventName}\n`),
    encodeURIComponent(`Ref: ${receiptId}\n`),
    encodeURIComponent(`Devotee: ${devoteeName}\n`),
  ].join('');

  return `https://wa.me/${TEMPLE_CONSTANTS.PRIEST.WHATSAPP.replace('+', '')}?text=${msg}`;
}
