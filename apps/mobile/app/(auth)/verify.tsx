import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { AuthScreen, FormError } from "../../components/AuthScreen";
import { Button } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { startSession } from "../../lib/session";
import type { Me } from "../../lib/types";
import { toast } from "../../stores/toast";

export default function VerifyScreen() {
  const router = useRouter();
  const { userId, email } = useLocalSearchParams<{ userId: string; email?: string }>();
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verify = useMutation({
    mutationFn: (otp: string) => api<{ user: Me; accessToken: string; refreshToken: string }>("post", "/api/auth/verify-otp", { userId, otp }),
    onSuccess: async (session) => {
      await startSession(session);
      toast.success("Your email is verified. Welcome to Lettr.");
      router.dismissAll();
      router.replace(session.user.role === "LANDLORD" ? "/overview" : "/");
    },
  });

  const resend = useMutation({
    mutationFn: () => api<{ message: string }>("post", "/api/auth/resend-otp", { userId }),
    onSuccess: (data) => {
      toast.info(data.message);
      setCooldown(60);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const onChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) verify.mutate(digits);
  };

  return (
    <AuthScreen title="Check your email" sub={`Enter the 6-digit code we sent${email ? ` to ${email}` : ""}. It expires in 10 minutes.`}>
      {/* One field with one-time-code autofill — the code from email/SMS fills in a tap. */}
      <TextInput
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        accessibilityLabel="Verification code"
        className={`h-16 rounded-xl border-2 bg-surface text-center font-sans-bold text-3xl tracking-[12px] text-ink ${verify.isError ? "border-bad" : "border-line-strong"}`}
      />
      <FormError message={verify.isError ? errorMessage(verify.error) : null} />
      <Button size="lg" loading={verify.isPending} disabled={code.length !== 6} onPress={() => verify.mutate(code)}>
        Verify email
      </Button>
      {cooldown > 0 ? (
        <Text className="text-center font-sans text-sm text-muted">You can request a new code in {cooldown}s</Text>
      ) : (
        <Pressable onPress={() => resend.mutate()} disabled={resend.isPending}>
          <Text className="text-center font-sans-bold text-sm text-navy">Send a new code</Text>
        </Pressable>
      )}
    </AuthScreen>
  );
}
