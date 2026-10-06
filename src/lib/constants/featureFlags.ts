/** Add stable flag keys here before using them in server-side code. */
export const FEATURE_FLAGS = {
  NEWSLETTER_PREVIEW: "newsletter_preview",
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
