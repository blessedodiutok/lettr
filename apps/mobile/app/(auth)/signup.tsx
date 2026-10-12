import { Feather } from "@expo/vector-icons";
import { SignupSchema } from "@lettr/zod-schemas";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthScreen, FormError } from "../../components/AuthScreen";
import { Button, COLORS, Field } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";

const ROLES = [
  { value: "TENANT", title: "Looking for a home", icon: "search" },
  { value: "LANDLORD", title: "Letting a property", icon: "home" },
] as const;

export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ role: "TENANT" as "TENANT" | "LANDLORD", firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const signup = useMutation({
    mutationFn: (body: unknown) => api<{ userId: string; email: string }>("post", "/api/auth/signup", body),
    onSuccess: (data) => router.push({ pathname: "/(auth)/verify", params: { userId: data.userId, email: data.email } }),
  });

  const submit = () => {
    const parsed = SignupSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      return setErrors(next);
    }
    setErrors({});
    signup.mutate(parsed.data);
  };

  return (
    <AuthScreen title="Create your account" sub="Free to join. Tenants pay a 3% fee only when they rent.">
      <View className="flex-row gap-3">
        {ROLES.map((role) => {
          const active = form.role === role.value;
          return (
            <Pressable
              key={role.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setForm((f) => ({ ...f, role: role.value }))}
              className={`flex-1 gap-2 rounded-xl border-2 p-3.5 ${active ? "border-navy bg-navy-soft" : "border-line bg-surface"}`}
            >
              <Feather name={role.icon} size={20} color={active ? COLORS.navy : COLORS.muted} />
              <Text className="font-sans-bold text-sm text-ink">{role.title}</Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="First name" value={form.firstName} onChangeText={set("firstName")} autoComplete="given-name" error={errors.firstName} />
        </View>
        <View className="flex-1">
          <Field label="Last name" value={form.lastName} onChangeText={set("lastName")} autoComplete="family-name" error={errors.lastName} />
        </View>
      </View>
      <Field label="Email address" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
      <Field label="Phone number (optional)" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" placeholder="0801 234 5678" error={errors.phone} />
      <Field label="Password" value={form.password} onChangeText={set("password")} secureTextEntry autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.password} />
      <FormError message={signup.isError ? errorMessage(signup.error) : null} />
      <Button size="lg" loading={signup.isPending} onPress={submit}>
        Create account
      </Button>
      <Text className="text-center font-sans text-sm text-muted">
        Already have an account?{" "}
        <Link href="/(auth)/login" className="font-sans-bold text-navy">
          Log in
        </Link>
      </Text>
    </AuthScreen>
  );
}
