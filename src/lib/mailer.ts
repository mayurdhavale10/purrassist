// src/lib/mailer.ts
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  APP_URL,
  NEXT_PUBLIC_APP_URL,
} = process.env;

const BASE_URL = APP_URL || NEXT_PUBLIC_APP_URL || "https://purrassist.vercel.app";
const LOGO_URL = `${BASE_URL}/purr_assit_logo.webp`;

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465, // 465 = SSL, 587 = STARTTLS
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

/**
 * Send a branded OTP email.
 * @param to recipient email
 * @param code 6-digit code as string
 * @param options optional override for subject/preview
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  options?: { subject?: string; previewText?: string }
) {
  const from = MAIL_FROM || "PurrAssist <no-reply@purrassist.app>";
  const subject = options?.subject ?? "⏰ Don't leave us on 'read'! Your PurrAssist code is waiting…";
  const previewText =
    options?.previewText ??
    `Your PurrAssist verification code is ${code}. It expires in 10 minutes.`;

  // Plain-text fallback
  const text = [
    "PurrAssist verification",
    "",
    "Hey there, future verified college connection!",
    "",
    `Your code: ${code}`,
    "This code expires in 10 minutes.",
    "",
    "If you didn’t request this, ignore this email.",
  ].join("\n");

  // Simple, resilient HTML (tables for broad client support)
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>PurrAssist verification</title>
    <style>
      /* Dark-ish neutral with accent */
      .bg { background:#0b0f1a; padding:24px; }
      .card {
        width:100%; max-width:560px; margin:0 auto; border-radius:16px;
        background:#0f1424; border:1px solid rgba(255,255,255,0.08);
        overflow:hidden;
      }
      .header {
        padding:20px; display:flex; align-items:center; gap:12px;
        background:linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        border-bottom:1px solid rgba(255,255,255,0.06);
      }
      .brand { color:#fff; font-weight:700; font-size:16px; margin:0; }
      .content { padding:24px; color:#dbe0ff; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.6; }
      .eyebrow { color:#90a0ff; font-size:12px; letter-spacing:.08em; text-transform:uppercase; margin:0 0 4px; }
      h1 { color:#fff; margin:0 0 12px; font-size:20px; }
      p { margin:0 0 12px; }
      .code {
        margin:16px 0; padding:14px 18px; text-align:center; font-size:24px; font-weight:800;
        letter-spacing:0.28em; color:#0b0f1a; background:#fff; border-radius:12px;
      }
      .meta { color:#aeb6ff; font-size:12px; }
      .cta {
        display:inline-block; margin-top:8px; padding:12px 16px; border-radius:12px; text-decoration:none;
        background:#ffffff1a; color:#fff; border:1px solid #ffffff33;
      }
      .footer { padding:14px 20px; color:#9aa3c7; font-size:12px; text-align:center; }
      .logo { border-radius:8px; }
    </style>
  </head>
  <body class="bg">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden">${previewText}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td>
        <div class="card">
          <div class="header">
            <img src="${LOGO_URL}" alt="PurrAssist" width="28" height="28" class="logo" />
            <p class="brand">PurrAssist</p>
          </div>
          <div class="content">
            <p class="eyebrow">Verification</p>
            <h1>Don’t leave us on “read” 😉</h1>
            <p>Hey there, future verified college connection!</p>
            <p>We see you lingering in the inbox. It's okay—you're busy. But a secure, creep-free community needs a tiny bit of effort, and we're holding the velvet rope just for you.</p>
            <p>Complete your verification before this code vanishes like a Friday night social life during finals week:</p>
            <div class="code">${code}</div>
            <p class="meta">This code expires in <strong>10 minutes</strong>. If you didn’t request it, you can safely ignore this email.</p>
            <!-- If you later add a deep link /verify?code=XXXXXX, turn this into a real CTA -->
            <a class="cta" href="${BASE_URL}" target="_blank" rel="noopener">Open PurrAssist</a>
          </div>
          <div class="footer">
            Sent by PurrAssist • ${BASE_URL.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </td></tr>
    </table>
  </body>
</html>`;

  return mailer.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
