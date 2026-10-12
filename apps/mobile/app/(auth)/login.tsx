import { LoginSchema } from "@lettr/zod-schemas";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { AuthScreen, FormError } from "../../components/AuthScreen";
import { Button, Field } from "../../components/ui";
import { api, errorCode, errorData, errorMessage } from "../../lib/api";
import { startSession } from "../../lib/session";
import type { Me } from "../../lib/types";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) => api<{ user: Me; accessToken: string; refreshToken: string }>("post", "/api/auth/login", body),
    onSuccess: async (session) => {
      await startSession(session);
      router.dismissAll();
      router.replace(session.user.role === "LANDLORD" ? "/overview" : "/");
    },
    onError: (e) => {
      if (errorCode(e) === "EMAIL_NOT_VERIFIED") {
        const data = errorData<{ userId: string; email: string }>(e);
        if (data) return router.push({ pathname: "/(auth)/verify", params: data });
      }
      setError(errorMessage(e));
    },
  });

  const submit = () => {
    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError(null);
    login.mutate(parsed.data);
  };

  return (
    <AuthScreen title="Welcome back" sub="Log in to continue to your home or your listings.">
      <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} />
      <Link href="/(auth)/forgot-password" className="self-end font-sans-bold text-sm text-navy">
        Forgot password?
      </Link>
      <FormError message={error} />
      <Button size="lg" loading={login.isPending} onPress={submit}>
        Log in
      </Button>
      <Text className="text-center font-sans text-sm text-muted">
        New to Lettr?{" "}
        <Link href="/(auth)/signup" className="font-sans-bold text-navy">
          Create an account
        </Link>
      </Text>
    </AuthScreen>
  );
}
