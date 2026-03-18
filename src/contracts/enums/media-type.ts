export const MediaType = {
  FOTO: "foto",
  VIDEO: "video",
  DOCUMENTO: "documento",
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];
