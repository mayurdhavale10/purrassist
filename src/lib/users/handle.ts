// src/lib/users/handle.ts

/** Rules: 3–20 chars, letters/numbers/._, must start with a letter */
const HANDLE_RE = /^[a-zA-Z][a-zA-Z0-9._]{2,19}$/;

export function normalizeHandle(raw: string) {
  return raw.trim();
}

export function toLowerHandle(raw: string) {
  return normalizeHandle(raw).toLowerCase();
}

export function validateHandle(raw: string) {
  const h = normalizeHandle(raw);
  if (!h) return { ok: false, reason: "empty" as const };
  if (!HANDLE_RE.test(h)) return { ok: false, reason: "invalid_format" as const };
  return { ok: true as const };
}

export type HandleCheckReason = "empty" | "invalid_format" | "taken";
