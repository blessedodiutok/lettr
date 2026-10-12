import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { AuthScreen, FormError } from "../../components/AuthScreen";
import { Button, Card, Field } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const forgot = useMutation({ mutationFn: () => api<{ message: string }>("post", "/api/auth/forgot-password", { email }) });

  if (forgot.isSuccess) {
    return (
      <AuthScreen title="Check your email">
        <Card>
          <Text className="font-sans text-[15px] text-ink-2">{forgot.data.message} Open the link on this phone or any browser to choose a new password.</Text>
        </Card>
        <Button variant="secondary" onPress={() => router.back()}>
          Back to login
        </Button>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Reset your password" sub="We'll email you a link to choose a new one.">
      <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <FormError message={forgot.isError ? errorMessage(forgot.error) : null} />
      <Button size="lg" loading={forgot.isPending} disabled={!email.includes("@")} onPress={() => forgot.mutate()}>
        Send reset link
      </Button>
    </AuthScreen>
  );
}
