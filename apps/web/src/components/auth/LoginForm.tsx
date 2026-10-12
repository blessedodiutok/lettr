// File: apps/web/src/components/auth/LoginForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLogin } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { FormField } from "./FormField";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const errorMessage =
    (login.error as { response?: { data?: { error?: string } } })?.response
      ?.data?.error ?? "Login failed. Please try again.";

  return (
    <form
      onSubmit={handleSubmit((data) => login.mutate(data))}
      className="space-y-5"
      noValidate
    >
      <FormField
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="space-y-1.5">
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        {/* Forgot password — right-aligned under the field */}
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-xs font-medium text-brand-navy hover:text-(--color-primary-700) hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {login.isError && <AuthErrorAlert message={errorMessage} />}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={login.isPending}
        loadingText="Logging in…"
      >
        Log in
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-semibold text-brand-navy hover:underline"
        >
          Sign up free
        </Link>
      </p>
    </form>
  );
}
