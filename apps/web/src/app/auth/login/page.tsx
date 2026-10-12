// File: apps/web/src/app/auth/login/page.tsx
import type { Metadata } from "next";
import { AuthLayout } from "../../../components/auth/AuthLayout";
import { LoginForm } from "../../../components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Log in to your Lettr account to continue your search."
    >
      <LoginForm />
    </AuthLayout>
  );
}
