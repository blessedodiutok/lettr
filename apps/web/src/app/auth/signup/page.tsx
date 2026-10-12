// File: apps/web/src/app/auth/signup/page.tsx
import type { Metadata } from "next";
import { AuthLayout } from "../../../components/auth/AuthLayout";
import { SignupForm } from "../../../components/auth/SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthLayout
      heading="Join Lettr"
      subheading="Find a home or list your property — no agents, no hidden fees."
    >
      <SignupForm />
    </AuthLayout>
  );
}
