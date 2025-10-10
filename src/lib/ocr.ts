// src/lib/ocr.ts
import { createWorker } from "tesseract.js";
import sharp from "sharp";

function strip(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function ocrImageToText(buf: Buffer): Promise<string> {
  const pre = await sharp(buf)
    .rotate()
    .grayscale()
    .normalise()
    .sharpen()
    .toBuffer();

  const worker = await createWorker("eng", 1, {
    // @ts-ignore silence logs
    logger: () => {},
  });

  // No options object here (avoids TS error)
  const { data } = await worker.recognize(pre);
  await worker.terminate();
  return strip(data?.text || "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

/**
 * Flexible name check:
 * - Tokenize profile name (e.g. "mayur dhavale" -> ["mayur","dhavale"])
 * - A token matches if substring OR Levenshtein ≤ 2
 * - ok if matchedCount / totalTokens ≥ 0.5
 */
export function nameMatchScore(profileName: string, ocrText: string) {
  const tokens = strip(profileName).split(" ").filter(Boolean);
  const words = strip(ocrText).split(/\s+/).filter(Boolean);
  let matched = 0;

  for (const tok of tokens) {
    if (!tok) continue;

    if (ocrText.includes(tok)) {
      matched++;
      continue;
    }

    let hit = false;
    for (const w of words) {
      if (w && levenshtein(tok, w) <= 2) {
        hit = true;
        break;
      }
    }
    if (hit) matched++;
  }

  const total = tokens.length || 1;
  const ratio = matched / total;
  const ok = ratio >= 0.5;

  return { ok, matched, total, ratio, tokens };
}
