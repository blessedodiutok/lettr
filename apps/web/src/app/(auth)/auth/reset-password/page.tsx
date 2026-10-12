"use client";

import { PasswordSchema } from "@lettr/zod-schemas";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthHeading, FormError } from "../../../../components/auth/AuthHeading";
import { Button } from "../../../../components/ui/button";
import { Field, Input } from "../../../../components/ui/field";
import { useResetPassword } from "../../../../hooks/useAuth";
import { errorMessage } from "../../../../lib/api";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const reset = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (reset.isSuccess) {
    return (
      <>
        <AuthHeading title="Password changed" description="You've been signed out everywhere. Log in with your new password." />
        <Button asChild block>
          <Link href="/auth/login">Log in</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Choose a new password" />
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = PasswordSchema.safeParse(password);
          if (!parsed.success) return setError(parsed.error.issues[0].message);
          if (password !== confirm) return setError("The passwords don't match.");
          setError(null);
          reset.mutate({ token, password });
        }}
      >
        <Field label="New password" hint="At least 8 characters, with a letter and a number.">
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <FormError message={error ?? (reset.isError ? errorMessage(reset.error) : null)} />
        <Button type="submit" size="lg" block isLoading={reset.isPending} disabled={!token}>
          Change password
        </Button>
        {!token && <FormError message="This reset link is incomplete. Request a new one." />}
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
