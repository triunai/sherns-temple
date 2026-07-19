export interface Event {
  event_id: string;
  event_name: string;
  featured_poster: string | null;
  show_in_carousel: boolean;
  display_qr_asset: string | null;
  bank_details_display: string;
  cost_per_pax: number;
  abhishegam_time: string | null;
  pooja_start_time: string | null;
  special_notes: string | null;
  is_favorited: boolean;
  status: 'Draft' | 'Active' | 'Archived';
  created_at: string;
}

export interface EventMaterial {
  item_id: string;
  event_id: string;
  material_name: string;
  target_quantity: number;
  unit_type: string;
  qty_received: number;
  funding_status: 'Open' | 'Filled';
  created_at: string;
}

export interface DevoteeSubmission {
  receipt_id: string;
  event_id: string;
  devotee_name: string;
  devotee_whatsapp: string;
  devotee_email: string;
  primary_natchatram: string | null;
  primary_rasi: string | null;
  family_json: FamilyMember[];
  sponsored_items: SponsoredItem[];
  total_amount_paid: number;
  payment_proof: string;
  admin_approval: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

export type FamilyMember = {
  name: string;
  natchatram: string;
  rasi: string;
};

export type SponsoredItem = {
  item_id: string;
  material_name: string;
  unit_type: string;
  qty_given: number;
};

export type Language = 'EN' | 'TA' | 'BM';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface SubTotals {
  baseFee: number;
  sponsorshipTotal: number;
  grandTotal: number;
}

export interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'dropdown';
  required: boolean;
  placeholder?: string;
  optionsSource?: 'natchatram' | 'rasi' | 'unit_type';
  visible: boolean;
}

export interface ValidationRule {
  pattern: RegExp;
  messageKey: string;
}

export interface AdminProfile {
  user_id: string;
  email: string;
  is_approved: boolean;
  role: 'superadmin' | 'admin';
  created_at: string;
}

export type AdminTab = 'submissions' | 'events' | 'management' | 'settings';

export interface EventUpsert {
  event_name: string;
  featured_poster: string | null;
  show_in_carousel: boolean;
  cost_per_pax: number;
  abhishegam_time: string | null;
  special_notes: string | null;
  status: 'Draft' | 'Active' | 'Archived';
}

export interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  collected: number;
  awaiting: number;
}

export interface ApprovalStateConfig {
  next: ApprovalStatus[];
  color: string;
  icon: string;
}
