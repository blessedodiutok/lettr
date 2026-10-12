// File: apps/web/src/components/auth/SignupForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSignup } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { FormField } from "./FormField";

const schema = z.object({
  role: z.enum(["TENANT", "LANDLORD"]),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Minimum 8 characters"),
});
type FormData = z.infer<typeof schema>;

/* ── Password strength ────────────────────────────────────────────────────── */
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1)
    return { score, label: "Weak", color: "var(--color-danger-500)" };
  if (score <= 2)
    return { score, label: "Fair", color: "var(--color-warning-500)" };
  if (score <= 3)
    return { score, label: "Good", color: "var(--color-accent-500)" };
  return { score, label: "Strong", color: "var(--color-success-500)" };
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-2">
      {/* Segment bars */}
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                bar <= Math.ceil(score / 1.25)
                  ? color
                  : "var(--color-neutral-200)",
            }}
          />
        ))}
      </div>
      <p
        className="text-xs font-medium"
        style={{ color }}
        aria-live="polite"
        aria-label={`Password strength: ${label}`}
      >
        {label}
      </p>
    </div>
  );
}

/* ── Role option ──────────────────────────────────────────────────────────── */
function RoleOption({
  active,
  onSelect,
  icon,
  title,
  description,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "relative flex flex-col items-start gap-1.5",
        "p-4 rounded-xl border-2 text-left",
        "transition-all duration-150",
        active
          ? "border-brand-navy bg-(--color-primary-50) shadow-sm"
          : "border-neutral-200 hover:border-(--color-primary-200) bg-white",
      )}
    >
      {/* Selected indicator */}
      {active && (
        <span
          aria-hidden="true"
          className="
            absolute top-3 right-3
            w-5 h-5 rounded-full
            bg-brand-navy
            flex items-center justify-center
          "
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2.5 2.5L8 2.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      <span
        className={cn(
          "text-brand-navy transition-colors",
          !active && "text-neutral-400",
        )}
        aria-hidden="true"
      >
        {icon}
      </span>

      <div>
        <p
          className={cn(
            "text-sm font-semibold transition-colors",
            active ? "text-(--color-primary-700)" : "text-neutral-700",
          )}
        >
          {title}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
          {description}
        </p>
      </div>
    </button>
  );
}

/* ── Main form ────────────────────────────────────────────────────────────── */
export function SignupForm() {
  const [role, setRole] = useState<"TENANT" | "LANDLORD">("TENANT");
  const [password, setPassword] = useState("");
  const signup = useSignup();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "TENANT" },
  });

  function selectRole(r: "TENANT" | "LANDLORD") {
    setRole(r);
    setValue("role", r);
  }

  const errorMessage =
    (signup.error as { response?: { data?: { error?: string } } })?.response
      ?.data?.error ?? "Sign up failed. Please try again.";

  return (
    <form
      onSubmit={handleSubmit((data) => signup.mutate(data))}
      className="space-y-5"
      noValidate
    >
      {/* Role selector */}
      <div>
        <p className="text-sm font-semibold text-neutral-700 mb-2.5">
          I want to…
        </p>
        <div className="grid grid-cols-2 gap-3">
          <RoleOption
            active={role === "TENANT"}
            onSelect={() => selectRole("TENANT")}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
            title="Rent a home"
            description="Browse and rent directly from landlords"
          />
          <RoleOption
            active={role === "LANDLORD"}
            onSelect={() => selectRole("LANDLORD")}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            }
            title="List a property"
            description="Rent out your property without agents"
          />
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="First name"
          type="text"
          autoComplete="given-name"
          placeholder="Emeka"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <FormField
          label="Last name"
          type="text"
          autoComplete="family-name"
          placeholder="Okonkwo"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>

      <FormField
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <FormField
        label="Phone number"
        type="tel"
        autoComplete="tel"
        placeholder="+234 800 000 0000"
        optional
        {...register("phone")}
      />

      {/* Password with strength meter */}
      <div>
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          error={errors.password?.message}
          hint="Use uppercase, numbers, and symbols for a stronger password"
          {...register("password", {
            onChange: (e) => setPassword(e.target.value),
          })}
        />
        <PasswordStrength password={password} />
      </div>

      {signup.isError && <AuthErrorAlert message={errorMessage} />}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={signup.isPending}
        loadingText="Creating account…"
      >
        Create account
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-brand-navy hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
