// src/lib/otp.ts
import crypto from "crypto";

export function generateCode(digits = 6): string {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function verifyHash(code: string, hash: string): boolean {
  const h = hashCode(code);
  // timing-safe compare
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
}

export function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60_000);
}

export function canSendAgain(last?: Date | null, cooldownSec = 60): boolean {
  if (!last) return true;
  return Date.now() - new Date(last).getTime() >= cooldownSec * 1000;
}
