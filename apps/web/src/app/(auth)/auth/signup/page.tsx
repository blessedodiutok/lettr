"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema } from "@lettr/zod-schemas";
import { Building2, Home } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AuthHeading, FormError } from "../../../../components/auth/AuthHeading";
import { DemoAccounts } from "../../../../components/demo/DemoAccounts";
import { Button } from "../../../../components/ui/button";
import { Field, Input } from "../../../../components/ui/field";
import { useSignup } from "../../../../hooks/useAuth";
import { errorMessage } from "../../../../lib/api";
import { cn } from "../../../../lib/cn";
import { IS_DEMO } from "../../../../lib/demo";

type Values = z.input<typeof SignupSchema>;

const ROLES = [
  { value: "TENANT", title: "I'm looking for a home", body: "Find a place and rent it directly", icon: Home },
  { value: "LANDLORD", title: "I'm letting a property", body: "List homes and find tenants", icon: Building2 },
] as const;

function SignupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next");
  const signup = useSignup();
  const { register, handleSubmit, watch, setValue, formState } = useForm<Values>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { role: params.get("role") === "LANDLORD" ? "LANDLORD" : "TENANT" },
  });
  const role = watch("role");

  const onSubmit = handleSubmit((values) =>
    signup.mutate(values as z.output<typeof SignupSchema>, {
      onSuccess: (data) =>
        router.push(`/auth/verify?userId=${data.userId}&email=${encodeURIComponent(data.email)}${next ? `&next=${encodeURIComponent(next)}` : ""}`),
    }),
  );

  return (
    <>
      <AuthHeading title="Create your account" description="It's free. Landlords list for free; tenants pay a 3% fee only when they rent." />
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        <fieldset>
          <legend className="sr-only">Account type</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(({ value, title, body, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={role === value}
                onClick={() => setValue("role", value)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-card border-2 p-3.5 text-left transition-colors",
                  role === value ? "border-navy bg-navy-soft" : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <Icon className={cn("mb-1 size-5", role === value ? "text-navy" : "text-muted")} aria-hidden />
                <span className="text-sm font-semibold text-ink">{title}</span>
                <span className="text-xs text-muted">{body}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={formState.errors.firstName?.message}>
            <Input autoComplete="given-name" {...register("firstName")} />
          </Field>
          <Field label="Last name" error={formState.errors.lastName?.message}>
            <Input autoComplete="family-name" {...register("lastName")} />
          </Field>
        </div>
        <Field label="Email address" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Phone number" optional hint="We'll only use it for updates about your rental." error={formState.errors.phone?.message}>
          <Input type="tel" autoComplete="tel" placeholder="0801 234 5678" {...register("phone")} />
        </Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a number." error={formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <FormError message={signup.isError ? errorMessage(signup.error) : null} />
        <Button type="submit" size="lg" block isLoading={signup.isPending}>
          Create account
        </Button>
        <p className="text-center text-xs text-muted">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-navy hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  if (IS_DEMO) {
    return (
      <>
        <AuthHeading title="Sign-up is off in this demo" description="That way, nobody's personal details are collected. These accounts are ready to use, with rentals already in progress." />
        <DemoAccounts stacked />
      </>
    );
  }
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
