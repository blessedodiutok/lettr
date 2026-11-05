"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthHeading, FormError } from "../../../../components/auth/AuthHeading";
import { Button } from "../../../../components/ui/button";
import { Field, Input } from "../../../../components/ui/field";
import { useForgotPassword } from "../../../../hooks/useAuth";
import { errorMessage } from "../../../../lib/api";
import { IS_DEMO } from "../../../../lib/demo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const forgot = useForgotPassword();

  if (IS_DEMO) {
    return (
      <>
        <AuthHeading title="No passwords to reset" description="This demo sends no emails, and its accounts don't need a password. Choose one on the login page." />
        <Button asChild variant="secondary" block>
          <Link href="/auth/login">Back to login</Link>
        </Button>
      </>
    );
  }

  if (forgot.isSuccess) {
    return (
      <>
        <MailCheck className="mb-4 size-10 text-ok" aria-hidden />
        <AuthHeading title="Check your email" description={forgot.data.message} />
        <p className="text-sm text-muted">The link works for 30 minutes. If nothing arrives, check spam or try again.</p>
        <Button asChild variant="secondary" block className="mt-6">
          <Link href="/auth/login">Back to login</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Reset your password" description="Enter the email you signed up with and we'll send you a link to choose a new password." />
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          forgot.mutate(email);
        }}
      >
        <Field label="Email address">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <FormError message={forgot.isError ? errorMessage(forgot.error) : null} />
        <Button type="submit" size="lg" block isLoading={forgot.isPending}>
          Send reset link
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/auth/login" className="font-semibold text-navy hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
