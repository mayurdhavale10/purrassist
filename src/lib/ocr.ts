import { createWorker } from "tesseract.js";
import sharp from "sharp";

export async function ocrImageToText(buf: Buffer): Promise<string> {
  // light cleanup → helps OCR a lot
  const pre = await sharp(buf)
    .rotate()                 // auto-orient
    .grayscale()
    .normalise()
    .sharpen()
    .toBuffer();

  const worker = await createWorker("eng"); // downloads eng traineddata on first run
  const { data } = await worker.recognize(pre);
  await worker.terminate();
  return (data?.text || "").toLowerCase();
}

/** very small fuzzy: each token must appear with edit distance ≤ 1 OR as substring */
export function nameLooksPresent(profileName: string, ocrText: string): {ok:boolean; tokens:string[]} {
  const tokens = profileName
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean); // ["mayur","dhavale"]

  const ocr = ocrText.toLowerCase();
  const ok = tokens.every(tok => {
    if (ocr.includes(tok)) return true;
    // edit distance ≤ 1
    for (const w of ocr.split(/\W+/)) {
      if (levenshtein(tok, w) <= 1) return true;
    }
    return false;
  });

  return { ok, tokens };
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}
