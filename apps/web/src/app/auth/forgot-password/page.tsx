import { PlaceholderPage } from "../../../components/PlaceholderPage";

export default function ForgotPasswordPage() {
  return (
    <PlaceholderPage
      title="Reset your password"
      description="Password reset is being prepared. For now, contact support if you need help accessing your account."
      backHref="/auth/login"
      backLabel="Back to login"
    />
  );
}
