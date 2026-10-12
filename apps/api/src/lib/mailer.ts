// File: apps/api/src/lib/mailer.ts
// Email sending via Resend (primary) with Nodemailer SMTP as fallback
// All outgoing emails go through sendEmail() — never call transports directly

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(env.RESEND_API_KEY);

const smtpTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/** Send an email — tries Resend first, falls back to SMTP on failure */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { to, subject, html, text } = payload;
  const from = env.EMAIL_FROM;
  const toArray = Array.isArray(to) ? to : [to];

  // Try Resend first (production-grade, Nigerian delivery rates are better)
  if (env.RESEND_API_KEY) {
    try {
      await resend.emails.send({ from, to: toArray, subject, html, text });
      return;
    } catch (error) {
      console.warn("Resend failed — falling back to SMTP:", error);
    }
  }

  // Fallback: Nodemailer SMTP (Mailtrap in dev, your own SMTP in production)
  await smtpTransport.sendMail({
    from,
    to: toArray.join(", "),
    subject,
    html,
    text,
  });
}

// ── Email templates ────────────────────────────────────────────────────────

export function otpEmailHtml(firstName: string, otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Lettr verification code</title>
    </head>
    <body style="font-family: 'DM Sans', Arial, sans-serif; background: #FAFAF7; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #1A3C5E; font-size: 28px; margin-bottom: 8px;">
          Lettr
        </h1>
        <p style="color: #64748B; font-size: 14px; margin-top: 0;">Find your home. Cut the agent.</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
        <h2 style="color: #1A3C5E; font-size: 20px;">Hi ${firstName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your Lettr verification code is:
        </p>
        <div style="background: #F1F5F9; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1A3C5E;">
            ${otp}
          </span>
        </div>
        <p style="color: #64748B; font-size: 14px;">
          This code expires in 5 minutes. If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
        <p style="color: #94A3B8; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Lettr Technologies Ltd · Lagos, Nigeria
        </p>
      </div>
    </body>
    </html>
  `;
}

export function welcomeEmailHtml(firstName: string, role: string): string {
  const isLandlord = role === "LANDLORD";
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Welcome to Lettr</title></head>
    <body style="font-family: 'DM Sans', Arial, sans-serif; background: #FAFAF7; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 40px;">
        <h1 style="font-family: Georgia, serif; color: #1A3C5E; font-size: 28px;">Lettr</h1>
        <h2 style="color: #1A3C5E;">Welcome, ${firstName}! 🎉</h2>
        <p style="color: #374151; line-height: 1.6;">
          ${
            isLandlord
              ? "Your landlord account is ready. Start by listing your first property — no agent fees, no middlemen, direct connection with verified tenants."
              : "Your tenant account is ready. Browse thousands of verified listings across Nigeria and save up to 15% in agent fees on every rental."
          }
        </p>
        <a href="${env.API_URL.replace("4000", "3000")}"
           style="display: inline-block; background: #1A3C5E; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin-top: 16px;">
          ${isLandlord ? "List Your Property →" : "Find Your Home →"}
        </a>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;">
        <p style="color: #94A3B8; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Lettr Technologies Ltd · Lagos, Nigeria
        </p>
      </div>
    </body>
    </html>
  `;
}
