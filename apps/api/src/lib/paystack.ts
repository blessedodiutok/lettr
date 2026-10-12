// Thin Paystack client. Without a secret key outside production, calls are
// simulated so the full escrow flow can be exercised locally.

import axios from "axios";
import crypto from "node:crypto";
import { env, isPaystackSimulated } from "../config/env.js";
import { createError } from "../middleware/errorHandler.js";

const client = axios.create({
  baseURL: "https://api.paystack.co",
  headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY ?? ""}`, "Content-Type": "application/json" },
  timeout: 20_000,
});

function requireLive(feature: string) {
  if (!env.PAYSTACK_SECRET_KEY) throw createError(`${feature} needs Paystack to be configured.`, 503, { code: "PAYSTACK_NOT_CONFIGURED" });
}

export interface ChargeResult {
  status: string;
  reference: string;
  amount: number; // kobo
  currency: string;
  paidAt?: string;
  raw: Record<string, unknown>;
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
  simulateUrl: string;
}): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
  if (isPaystackSimulated) {
    return { authorizationUrl: params.simulateUrl, accessCode: `sim_${params.reference}`, reference: params.reference };
  }
  const response = await client.post("/transaction/initialize", {
    email: params.email,
    amount: params.amountKobo,
    reference: params.reference,
    currency: "NGN",
    callback_url: params.callbackUrl,
    metadata: params.metadata,
    channels: ["card", "bank", "bank_transfer", "ussd"],
  });
  const data = response.data.data as { authorization_url: string; access_code: string; reference: string };
  return { authorizationUrl: data.authorization_url, accessCode: data.access_code, reference: data.reference };
}

export async function verifyTransaction(reference: string): Promise<ChargeResult> {
  requireLive("Verifying payments");
  const response = await client.get(`/transaction/verify/${encodeURIComponent(reference)}`);
  const data = response.data.data as Record<string, unknown>;
  return {
    status: String(data.status),
    reference: String(data.reference),
    amount: Number(data.amount),
    currency: String(data.currency),
    paidAt: data.paid_at ? String(data.paid_at) : undefined,
    raw: data,
  };
}

export async function refundTransaction(reference: string, amountKobo: number): Promise<void> {
  if (isPaystackSimulated) return;
  requireLive("Refunds");
  await client.post("/refund", { transaction: reference, amount: amountKobo });
}

export async function transferToBank(params: {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  amountKobo: number;
  reference: string;
  reason: string;
}): Promise<{ transferCode: string; status: string }> {
  requireLive("Payouts");
  const recipient = await client.post("/transferrecipient", {
    type: "nuban",
    name: params.accountName,
    account_number: params.accountNumber,
    bank_code: params.bankCode,
    currency: "NGN",
  });
  const transfer = await client.post("/transfer", {
    source: "balance",
    amount: params.amountKobo,
    recipient: recipient.data.data.recipient_code,
    reference: params.reference,
    reason: params.reason,
  });
  return { transferCode: transfer.data.data.transfer_code, status: transfer.data.data.status };
}

export interface Bank {
  name: string;
  code: string;
}

// A short list so bank selection works locally without Paystack.
const SIMULATED_BANKS: Bank[] = [
  { name: "Access Bank", code: "044" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "OPay", code: "999992" },
  { name: "United Bank For Africa", code: "033" },
  { name: "Zenith Bank", code: "057" },
];

let bankCache: { banks: Bank[]; fetchedAt: number } | undefined;

export async function listBanks(): Promise<Bank[]> {
  if (isPaystackSimulated) return SIMULATED_BANKS;
  if (bankCache && Date.now() - bankCache.fetchedAt < 24 * 60 * 60 * 1000) return bankCache.banks;
  const response = await client.get("/bank", { params: { country: "nigeria", currency: "NGN", perPage: 200 } });
  const banks = (response.data.data as Array<{ name: string; code: string; active: boolean }>)
    .filter((bank) => bank.active)
    .map(({ name, code }) => ({ name, code }));
  bankCache = { banks, fetchedAt: Date.now() };
  return banks;
}

/** Look up the account holder's name — confirms the landlord typed the right number. */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{ accountName: string }> {
  if (isPaystackSimulated) return { accountName: "SIMULATED ACCOUNT HOLDER" };
  try {
    const response = await client.get("/bank/resolve", { params: { account_number: accountNumber, bank_code: bankCode } });
    return { accountName: String(response.data.data.account_name) };
  } catch {
    throw createError("We couldn't find that account. Check the number and bank.", 400, { code: "ACCOUNT_NOT_FOUND" });
  }
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const secret = env.PAYSTACK_WEBHOOK_SECRET ?? env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  const expected = Buffer.from(crypto.createHmac("sha512", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
