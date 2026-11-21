export const MEDIA_VARIANT_PURPOSE = ["thum", "preview"] as const;

export type MediaVariantPurpose = (typeof MEDIA_VARIANT_PURPOSE)[number];