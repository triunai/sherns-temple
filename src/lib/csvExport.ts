import type { DevoteeSubmission, Event } from '@/types';

const CSV_HEADERS = [
  'Ref',
  'Event',
  'Name',
  'WhatsApp',
  'Email',
  'Natchatram',
  'Rasi',
  'Family',
  'Materials',
  'Amount (RM)',
  'Status',
  'Submitted At',
];

function csvEscape(value: string | number): string {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

function getEventName(eventId: string, events: Event[]): string {
  return events.find((e) => e.event_id === eventId)?.event_name ?? eventId.slice(0, 8);
}

function formatSubmittedAt(dt: string): string {
  return new Date(dt).toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildFamilyCell(submission: DevoteeSubmission): string {
  return submission.family_json
    .map((m) => `${m.name} (${m.natchatram}/${m.rasi})`)
    .join('; ');
}

function buildMaterialsCell(submission: DevoteeSubmission): string {
  return submission.sponsored_items
    .map((item) => `${item.material_name} x ${item.qty_given} ${item.unit_type}`)
    .join('; ');
}

export function exportSubmissionsCsv(submissions: DevoteeSubmission[], events: Event[]): void {
  const rows: string[][] = [CSV_HEADERS];

  for (const s of submissions) {
    rows.push([
      s.receipt_id,
      getEventName(s.event_id, events),
      s.devotee_name,
      s.devotee_whatsapp,
      s.devotee_email,
      s.primary_natchatram ?? '',
      s.primary_rasi ?? '',
      buildFamilyCell(s),
      buildMaterialsCell(s),
      s.total_amount_paid.toFixed(2),
      s.admin_approval,
      formatSubmittedAt(s.created_at),
    ]);
  }

  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'registrations.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
