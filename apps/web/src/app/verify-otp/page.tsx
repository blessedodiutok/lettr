// File: apps/web/src/app/verify-otp/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { OtpVerifier } from "../../components/auth/OtpVerifier";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyOtpPage() {
  return (
    <AuthLayout
      heading="Check your inbox"
      subheading="Enter the 6-digit code we sent to your email address to complete your registration."
    >
      <Suspense>
        <OtpVerifier />
      </Suspense>
    </AuthLayout>
  );
}
