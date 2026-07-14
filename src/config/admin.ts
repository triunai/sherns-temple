import type { ApprovalStatus, ApprovalStateConfig } from '@/types';

export const APPROVAL_STATES: Record<ApprovalStatus, ApprovalStateConfig> = {
  Pending: {
    next: ['Approved', 'Rejected'],
    color: 'bg-temple-yellow text-black',
    icon: '⏳',
  },
  Approved: {
    next: ['Rejected'],
    color: 'bg-green-600 text-white',
    icon: '✓',
  },
  Rejected: {
    next: ['Pending', 'Approved'],
    color: 'bg-red-600 text-white',
    icon: '✗',
  },
};

export const AUTH_ERROR_MAP: Record<string, string> = {
  invalid_credentials: 'auth_invalid_credentials',
  user_not_found: 'auth_user_not_found',
  email_not_confirmed: 'auth_email_not_confirmed',
  not_approved: 'auth_not_approved',
};

export function mapAuthError(errorMessage: string): string {
  for (const [code, key] of Object.entries(AUTH_ERROR_MAP)) {
    if (errorMessage.toLowerCase().includes(code.replace(/_/g, ' '))) {
      return key;
    }
  }
  return 'auth_invalid_credentials';
}
