// src/components/peserta/utils/emailUtils.ts
export function normalizeEmailKey(email?: string): string | null {
  if (!email) return null;
  return String(email).trim().toLowerCase();
}