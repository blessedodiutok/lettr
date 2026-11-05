"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@lettr/zod-schemas";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AuthHeading, FormError } from "../../../../components/auth/AuthHeading";
import { DemoAccounts } from "../../../../components/demo/DemoAccounts";
import { Button } from "../../../../components/ui/button";
import { Field, Input } from "../../../../components/ui/field";
import { useLogin } from "../../../../hooks/useAuth";
import { errorCode, errorData, errorMessage } from "../../../../lib/api";
import { IS_DEMO } from "../../../../lib/demo";

type Values = z.input<typeof LoginSchema>;

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next");
  const router = useRouter();
  const login = useLogin();
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(LoginSchema),
    // The demo's shared tenant account. These details are public on purpose.
    defaultValues: IS_DEMO ? { email: "tunde@lettr-test.com", password: "Lettr@2024!" } : undefined,
  });

  const onSubmit = handleSubmit((values) =>
    login.mutate(
      { ...values, next },
      {
        onError: (error) => {
          if (errorCode(error) === "EMAIL_NOT_VERIFIED") {
            const data = errorData<{ userId: string; email: string }>(error);
            if (data) router.push(`/auth/verify?userId=${data.userId}&email=${encodeURIComponent(data.email)}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
          }
        },
      },
    ),
  );

  return (
    <>
      <AuthHeading title={IS_DEMO ? "Try the demo" : "Welcome back"} description={IS_DEMO ? "Pick an account. No details needed." : "Log in to continue to your home or your listings."} />
      {IS_DEMO && (
        <div className="mb-8">
          <DemoAccounts stacked />
          <p className="mt-6 text-sm text-muted">Or use the login form, filled in with the tenant's details:</p>
        </div>
      )}
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        <Field label="Email address" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        <div className="-mt-2 text-right">
          <Link href="/auth/forgot-password" className="text-sm font-semibold text-navy hover:underline">
            Forgot password?
          </Link>
        </div>
        <FormError message={login.isError && errorCode(login.error) !== "EMAIL_NOT_VERIFIED" ? errorMessage(login.error) : null} />
        <Button type="submit" size="lg" block isLoading={login.isPending}>
          Log in
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        New to Lettr?{" "}
        <Link href={`/auth/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-navy hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
