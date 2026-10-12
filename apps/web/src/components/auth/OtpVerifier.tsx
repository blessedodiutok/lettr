// File: apps/web/src/components/auth/OtpVerifier.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useResendOtp, useVerifyOtp } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { AuthErrorAlert } from "./AuthErrorAlert";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export function OtpVerifier() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const email = searchParams.get("email") ?? "";

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp?.(); // graceful — hook may not exist yet

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Cooldown timer */
  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((d, i) => {
      next[i] = d;
    });
    setDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) return;
    verifyOtp.mutate({ userId, otp });
  }

  function handleResend() {
    if (cooldown > 0 || !resendOtp) return;
    resendOtp.mutate({ userId });
    startCooldown();
  }

  const otpComplete = digits.join("").length === OTP_LENGTH;
  const errorMessage =
    (verifyOtp.error as { response?: { data?: { error?: string } } })?.response
      ?.data?.error ?? "Invalid code. Please try again.";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Email confirmation */}
      {email && (
        <p className="text-sm text-neutral-500 text-center">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-neutral-800">{email}</span>
        </p>
      )}

      {/* OTP input grid */}
      <div
        className="flex gap-2.5 justify-center"
        role="group"
        aria-label="Enter your 6-digit verification code"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            className={cn(
              /* Base */
              "w-11 h-14 text-center text-xl font-bold",
              "border-2 rounded-xl",
              "transition-all duration-150",
              "focus:outline-none",
              "caret-transparent" /* hide cursor — single char inputs */,
              /* Empty */
              !digit && [
                "border-neutral-200",
                "text-neutral-300",
                "bg-(--color-neutral-50)",
                "focus:border-(--color-primary-500)",
                "focus:bg-white",
                "focus:ring-4 focus:ring-(--color-primary-100)",
              ],
              /* Filled */
              digit && [
                "border-(--color-primary-400)",
                "bg-(--color-primary-50)",
                "text-(--color-primary-700)",
                "focus:border-brand-navy",
                "focus:ring-4 focus:ring-(--color-primary-100)",
              ],
              /* Error */
              verifyOtp.isError &&
                "border-(--color-danger-400) bg-(--color-danger-50) text-(--color-danger-600)",
            )}
          />
        ))}
      </div>

      {/* Error */}
      {verifyOtp.isError && <AuthErrorAlert message={errorMessage} />}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={verifyOtp.isPending}
        loadingText="Verifying…"
        disabled={!otpComplete}
      >
        Verify email
      </Button>

      {/* Resend */}
      <div className="text-center">
        <p className="text-sm text-neutral-500">
          Didn&apos;t receive a code?{" "}
          {cooldown > 0 ? (
            <span className="font-medium text-neutral-400">
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={!resendOtp || resendOtp?.isPending}
              className="
                font-semibold text-brand-navy
                hover:underline hover:text-(--color-primary-700)
                transition-colors disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              Resend code
            </button>
          )}
        </p>
      </div>
    </form>
  );
}
