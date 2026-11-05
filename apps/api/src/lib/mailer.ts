// Email sending: Resend first, SMTP as fallback. Outside production with neither
// configured, emails are printed to the console so OTPs are visible locally.
// All outgoing emails go through sendEmail().

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env, isDemo, isProduction } from "../config/env.js";

const resend = env.RESEND_API_KEY && !isDemo ? new Resend(env.RESEND_API_KEY) : null;

const smtpTransport = env.SMTP_HOST && !isDemo
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  // The demo's accounts are fictional, so nothing is ever sent.
  if (isDemo) return;
  const { to, subject, html, text } = payload;
  const from = env.EMAIL_FROM;
  const toArray = Array.isArray(to) ? to : [to];

  if (resend) {
    try {
      const { error } = await resend.emails.send({ from, to: toArray, subject, html, text });
      if (!error) return;
      console.warn("Resend failed — falling back to SMTP:", error.message);
    } catch (error) {
      console.warn("Resend failed — falling back to SMTP:", error);
    }
  }

  if (smtpTransport) {
    await smtpTransport.sendMail({ from, to: toArray.join(", "), subject, html, text });
    return;
  }

  if (isProduction) throw new Error("No email provider is configured");
  console.info(`\n📧 [dev email] To: ${toArray.join(", ")}\n   Subject: ${subject}\n   ${text.replace(/\n/g, "\n   ")}\n`);
}

/** Send an email without failing the caller — used for non-critical notifications. */
export async function sendEmailSafely(payload: EmailPayload): Promise<void> {
  try {
    await sendEmail(payload);
  } catch (error) {
    console.error(`Email "${payload.subject}" could not be sent:`, error);
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function webUrl(path: string): string {
  return new URL(path, env.WEB_URL).toString();
}

interface LayoutOptions {
  greeting: string;
  paragraphs: string[];
  code?: string;
  action?: { label: string; url: string };
  footnote?: string;
}

function layout({ greeting, paragraphs, code, action, footnote }: LayoutOptions): string {
  const body = paragraphs
    .map((p) => `<p style="color:#34465A;font-size:16px;line-height:1.6;margin:0 0 14px">${escapeHtml(p)}</p>`)
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'DM Sans',Arial,sans-serif;background:#F3F5F8;padding:40px 12px;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:36px;border:1px solid #DAE2EA">
    <div style="font-family:Georgia,serif;color:#1A3C5E;font-size:26px;font-weight:600">Lettr<span style="color:#B8862A">.</span></div>
    <hr style="border:none;border-top:1px solid #DAE2EA;margin:20px 0">
    <h2 style="color:#0F1C2B;font-size:20px;margin:0 0 14px">${escapeHtml(greeting)}</h2>
    ${body}
    ${code ? `<div style="background:#EDF1F5;border-radius:8px;padding:20px;text-align:center;margin:20px 0"><span style="font-family:'Courier New',monospace;font-size:34px;font-weight:bold;letter-spacing:8px;color:#0F1C2B">${escapeHtml(code)}</span></div>` : ""}
    ${action ? `<a href="${escapeHtml(action.url)}" style="display:inline-block;background:#1A3C5E;color:#FFFFFF;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:600;margin:6px 0 10px">${escapeHtml(action.label)}</a>` : ""}
    ${footnote ? `<p style="color:#5B6B7D;font-size:13px;line-height:1.5;margin:16px 0 0">${escapeHtml(footnote)}</p>` : ""}
    <hr style="border:none;border-top:1px solid #DAE2EA;margin:24px 0 16px">
    <p style="color:#5B6B7D;font-size:12px;text-align:center;margin:0">© ${new Date().getFullYear()} Lettr Technologies Ltd · Lagos, Nigeria</p>
  </div>
</body></html>`;
}

const otpMinutes = () => Math.round(env.OTP_EXPIRY_SECONDS / 60);

export function otpEmail(firstName: string, otp: string): Omit<EmailPayload, "to"> {
  return {
    subject: "Your Lettr verification code",
    html: layout({
      greeting: `Hi ${firstName},`,
      paragraphs: ["Use this code to verify your email address:"],
      code: otp,
      footnote: `The code expires in ${otpMinutes()} minutes. If you didn't request it, you can ignore this email.`,
    }),
    text: `Your Lettr verification code is ${otp}. It expires in ${otpMinutes()} minutes.`,
  };
}

export function welcomeEmail(firstName: string, role: string): Omit<EmailPayload, "to"> {
  const isLandlord = role === "LANDLORD";
  const url = webUrl(isLandlord ? "/landlord/listings/new" : "/listings");
  const message = isLandlord
    ? "Your landlord account is ready. List your first property and talk to tenants directly — no agents involved."
    : "Your account is ready. Browse homes, message landlords directly, and pay into escrow when you've found the one.";
  return {
    subject: `Welcome to Lettr, ${firstName}`,
    html: layout({
      greeting: `Welcome, ${firstName}`,
      paragraphs: [message],
      action: { label: isLandlord ? "List a property" : "Find a home", url },
    }),
    text: `${message}\n\n${url}`,
  };
}

export function passwordResetEmail(firstName: string, url: string): Omit<EmailPayload, "to"> {
  return {
    subject: "Reset your Lettr password",
    html: layout({
      greeting: `Hi ${firstName},`,
      paragraphs: ["We received a request to reset your password. The link works for 30 minutes."],
      action: { label: "Choose a new password", url },
      footnote: "If you didn't ask for this, you can ignore this email — your password won't change.",
    }),
    text: `Reset your Lettr password (link valid for 30 minutes): ${url}`,
  };
}

export function notificationEmail(
  firstName: string,
  title: string,
  body: string,
  action?: { label: string; url: string },
): Omit<EmailPayload, "to"> {
  return {
    subject: title,
    html: layout({ greeting: `Hi ${firstName},`, paragraphs: [title, body], action }),
    text: `${title}\n\n${body}${action ? `\n\n${action.label}: ${action.url}` : ""}`,
  };
}
