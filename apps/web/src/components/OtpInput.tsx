// File: apps/web/src/components/OtpInput.tsx
// 6-box OTP input with auto-focus, paste support, and backspace navigation

"use client";

import { useRef, useState } from "react";
import { cn } from "../lib/utils";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function OtpInput({
  length = 6,
  onComplete,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      onComplete(next.join(""));
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    const next = [...digits];
    pasted.split("").forEach((d, i) => {
      next[i] = d;
    });
    setDigits(next);
    // Focus the box after the last pasted digit
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    if (pasted.length === length) {
      onComplete(pasted);
    }
  }

  return (
    <div
      className="flex gap-3 justify-center"
      role="group"
      aria-label="One-time password input"
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
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold",
            "rounded-lg border-2",
            "text-foreground bg-white",
            "transition-all duration-150",
            "focus:outline-none focus:border-(--color-primary-500)",
            "focus:ring-2 focus:ring-(--color-primary-500)/20",
            hasError
              ? "border-destructive"
              : digit
                ? "border-(--color-primary-400)"
                : "border-border",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
      ))}
    </div>
  );
}
