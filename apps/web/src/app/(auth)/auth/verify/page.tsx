"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AuthHeading, FormError } from "../../../../components/auth/AuthHeading";
import { Button } from "../../../../components/ui/button";
import { useResendOtp, useVerifyOtp } from "../../../../hooks/useAuth";
import { errorMessage } from "../../../../lib/api";
import { cn } from "../../../../lib/cn";

const LENGTH = 6;
const COOLDOWN = 60;

function VerifyForm() {
  const params = useSearchParams();
  const userId = params.get("userId") ?? "";
  const email = params.get("email");
  const next = params.get("next");
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(COOLDOWN);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const code = digits.join("");
  const submit = (value = code) => {
    if (value.length === LENGTH && !verify.isPending) verify.mutate({ userId, otp: value, next });
  };

  const fill = (start: number, chars: string) => {
    const nextDigits = [...digits];
    chars.split("").forEach((char, i) => {
      if (start + i < LENGTH) nextDigits[start + i] = char;
    });
    setDigits(nextDigits);
    refs.current[Math.min(start + chars.length, LENGTH - 1)]?.focus();
    if (nextDigits.join("").length === LENGTH) submit(nextDigits.join(""));
  };

  if (!userId) {
    return (
      <>
        <AuthHeading title="Verification link incomplete" description="Log in again and we'll send you a fresh code." />
        <Button asChild block>
          <Link href="/auth/login">Go to login</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthHeading
        title="Check your email"
        description={
          <>
            Enter the 6-digit code we sent{email ? <> to <b className="font-semibold text-ink">{email}</b></> : ""}. It expires in 10 minutes.
          </>
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="grid gap-6"
      >
        <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={digit}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => {
                // A phone's code autofill puts the whole code into one box, so spread it out.
                const value = e.target.value.replace(/\D/g, "");
                if (!value) {
                  setDigits((d) => d.map((x, j) => (j === i ? "" : x)));
                  return;
                }
                const typed = value.length > 1 && digits[i] && value.startsWith(digits[i]) ? value.slice(digits[i].length) : value;
                fill(typed.length > 1 ? 0 : i, typed.length > 1 ? typed.slice(0, LENGTH) : typed);
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              }}
              onPaste={(e) => {
                e.preventDefault();
                fill(0, e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH));
              }}
              className={cn(
                "tnum h-14 w-full min-w-0 rounded-control border-2 bg-surface text-center text-2xl font-bold text-ink outline-none focus:border-navy",
                verify.isError ? "border-bad" : "border-line-strong",
              )}
            />
          ))}
        </div>
        <FormError message={verify.isError ? errorMessage(verify.error) : null} />
        <Button type="submit" size="lg" block isLoading={verify.isPending} disabled={code.length !== LENGTH}>
          Verify email
        </Button>
        <p className="text-center text-sm text-muted">
          Didn&apos;t get it? Check spam, or{" "}
          {cooldown > 0 ? (
            <span className="tnum">resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              className="font-semibold text-navy hover:underline"
              disabled={resend.isPending}
              onClick={() => resend.mutate(userId, { onSuccess: () => setCooldown(COOLDOWN) })}
            >
              send a new code
            </button>
          )}
        </p>
      </form>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
