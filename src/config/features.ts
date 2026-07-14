export const FEATURES = {
  ENABLE_CAROUSEL: true,
  ENABLE_3D_DARSHAN: false,
  ENABLE_MATERIAL_SPONSORSHIP: true,
  ENABLE_PAYMENT_QR: true,
  ENABLE_FAMILY_MEMBERS: true,
  ENABLE_UPLOAD_RECEIPT: true,
  ENABLE_ADMIN_VIEW: true,
  REQUIRE_PAYMENT_PROOF: true,
  AUTO_EXPAND_FIRST_EVENT: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag] === true;
}
