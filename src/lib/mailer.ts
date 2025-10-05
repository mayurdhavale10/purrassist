// src/lib/mailer.ts
import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
  // Don’t throw during build; error will surface when trying to send
  // console.warn("Missing SMTP env vars");
}

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/others
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

export async function sendOtpEmail(to: string, code: string) {
  const from = MAIL_FROM || "no-reply@example.com";
  const html = `
    <div style="font-family:sans-serif;line-height:1.5">
      <h2>PurrAssist verification code</h2>
      <p>Your verification code is:</p>
      <div style="font-size:24px;font-weight:bold;letter-spacing:3px">${code}</div>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn’t request this, you can ignore this email.</p>
    </div>
  `;
  return mailer.sendMail({ from, to, subject: "Your PurrAssist code", html });
}
