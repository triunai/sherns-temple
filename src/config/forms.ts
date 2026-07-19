import type { FormFieldConfig, ValidationRule } from '@/types';

export const CONTACT_FIELDS: FormFieldConfig[] = [
  {
    key: 'devotee_name',
    label: 'contact_name',
    type: 'text',
    required: true,
    placeholder: 'contact_name_placeholder',
    visible: true,
  },
  {
    key: 'devotee_whatsapp',
    label: 'contact_whatsapp',
    type: 'tel',
    required: true,
    placeholder: 'contact_whatsapp_placeholder',
    visible: true,
  },
  {
    key: 'devotee_email',
    label: 'contact_email',
    type: 'email',
    required: true,
    placeholder: 'contact_email_placeholder',
    visible: true,
  },
  {
    key: 'primary_natchatram',
    label: 'contact_natchatram',
    type: 'dropdown',
    required: false,
    optionsSource: 'natchatram',
    visible: true,
  },
  {
    key: 'primary_rasi',
    label: 'contact_rasi',
    type: 'dropdown',
    required: false,
    optionsSource: 'rasi',
    visible: true,
  },
];

export const VALIDATION_RULES: Record<string, ValidationRule> = {
  devotee_whatsapp: {
    pattern: /^(\+?[1-9]\d{6,14}|0\d{8,10})$/,
    messageKey: 'invalid_whatsapp',
  },
  devotee_email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    messageKey: 'invalid_email',
  },
};
