"use client";

import { PasswordSchema } from "@lettr/zod-schemas";
import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormError } from "../../../components/auth/AuthHeading";
import { ThemeToggle } from "../../../components/layout/brand";
import { Button } from "../../../components/ui/button";
import { Avatar, Card, PageHeader } from "../../../components/ui/display";
import { Checkbox, Field, Input, Textarea } from "../../../components/ui/field";
import { useChangePassword } from "../../../hooks/useAuth";
import { useUpdateProfile, useUploadAvatar } from "../../../hooks/useAccount";
import { errorMessage } from "../../../lib/api";
import type { Me, TenantProfile } from "../../../lib/types";
import { useAuthStore } from "../../../stores/authStore";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}

function ProfileSection({ user }: { user: Me }) {
  const update = useUpdateProfile();
  const upload = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" });

  return (
    <Section title="Your details" description="Shown to the people you rent with.">
      <div className="mb-5 flex items-center gap-4">
        <Avatar person={user} size={64} />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />
        <Button variant="secondary" size="sm" isLoading={upload.isPending} onClick={() => fileRef.current?.click()}>
          <Camera className="size-4" aria-hidden /> Change photo
        </Button>
      </div>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({ firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name">
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
        </div>
        <Field label="Email address" hint="Contact us to change your email.">
          <Input value={user.email} disabled />
        </Field>
        <Field label="Phone number" optional>
          <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0801 234 5678" />
        </Field>
        <div>
          <Button type="submit" isLoading={update.isPending}>
            Save details
          </Button>
        </div>
      </form>
    </Section>
  );
}

type TenantForm = Partial<Record<keyof TenantProfile, string | boolean | number | null>>;

function TenantSection({ profile }: { profile: TenantProfile | null }) {
  const update = useUpdateProfile();
  const [form, setForm] = useState<TenantForm>({});
  useEffect(() => setForm(profile ?? {}), [profile]);
  const text = (key: keyof TenantProfile) => ({
    value: (form[key] as string | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <Section title="Rental profile" description="Landlords you contact can see this. A complete profile gets faster replies.">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = (v: unknown) => (typeof v === "string" ? v.trim() || undefined : v ?? undefined);
          update.mutate({
            tenantProfile: {
              occupation: clean(form.occupation),
              employerName: clean(form.employerName),
              monthlyIncome: form.monthlyIncome ? Number(String(form.monthlyIncome).replace(/\D/g, "")) : undefined,
              numberOfOccupants: form.numberOfOccupants ? Number(form.numberOfOccupants) : undefined,
              hasPets: Boolean(form.hasPets),
              petDescription: clean(form.petDescription),
              smokingHousehold: Boolean(form.smokingHousehold),
              previousAddress: clean(form.previousAddress),
              reasonForMoving: clean(form.reasonForMoving),
              nextOfKinName: clean(form.nextOfKinName),
              nextOfKinPhone: clean(form.nextOfKinPhone),
              nextOfKinRelation: clean(form.nextOfKinRelation),
            },
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Occupation" optional>
            <Input {...text("occupation")} />
          </Field>
          <Field label="Employer" optional>
            <Input {...text("employerName")} />
          </Field>
          <Field label="Monthly income" optional>
            <Input prefix="₦" inputMode="numeric" {...text("monthlyIncome")} value={form.monthlyIncome ? String(form.monthlyIncome) : ""} />
          </Field>
          <Field label="People moving in" optional>
            <Input type="number" min={1} max={20} {...text("numberOfOccupants")} value={form.numberOfOccupants ? String(form.numberOfOccupants) : ""} />
          </Field>
        </div>
        <Field label="Current address" optional>
          <Input {...text("previousAddress")} />
        </Field>
        <Field label="Why are you moving?" optional>
          <Textarea rows={2} {...text("reasonForMoving")} />
        </Field>
        <div className="grid gap-1">
          <Checkbox label="I have pets" checked={Boolean(form.hasPets)} onChange={(e) => setForm({ ...form, hasPets: e.target.checked })} />
          {form.hasPets && (
            <Field label="Tell landlords about your pets" className="ml-7">
              <Input {...text("petDescription")} />
            </Field>
          )}
          <Checkbox label="Someone in my household smokes" checked={Boolean(form.smokingHousehold)} onChange={(e) => setForm({ ...form, smokingHousehold: e.target.checked })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Next of kin" optional>
            <Input {...text("nextOfKinName")} />
          </Field>
          <Field label="Their phone" optional>
            <Input type="tel" {...text("nextOfKinPhone")} />
          </Field>
          <Field label="Relationship" optional>
            <Input {...text("nextOfKinRelation")} />
          </Field>
        </div>
        <div>
          <Button type="submit" isLoading={update.isPending}>
            Save rental profile
          </Button>
        </div>
      </form>
    </Section>
  );
}

function LandlordSection({ user }: { user: Me }) {
  const update = useUpdateProfile();
  const [businessName, setBusinessName] = useState(user.landlordProfile?.businessName ?? "");
  const [bio, setBio] = useState(user.landlordProfile?.bio ?? "");
  return (
    <Section title="Landlord profile" description="Shown on your listings and public profile page.">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({ landlordProfile: { businessName: businessName.trim() || undefined, bio: bio.trim() || undefined } });
        }}
      >
        <Field label="Business name" optional hint="If you let property through a company.">
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </Field>
        <Field label="About you" optional>
          <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} placeholder="How long you've been letting, how you look after your properties…" />
        </Field>
        <div>
          <Button type="submit" isLoading={update.isPending}>
            Save profile
          </Button>
        </div>
      </form>
    </Section>
  );
}

function SecuritySection() {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Section title="Password" description="Changing your password signs you out on other devices.">
      <form
        className="grid max-w-md gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = PasswordSchema.safeParse(next);
          if (!parsed.success) return setError(parsed.error.issues[0].message);
          setError(null);
          change.mutate(
            { currentPassword: current, newPassword: next },
            {
              onSuccess: () => {
                setCurrent("");
                setNext("");
              },
            },
          );
        }}
      >
        <Field label="Current password">
          <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" hint="At least 8 characters, with a letter and a number.">
          <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <FormError message={error ?? (change.isError ? errorMessage(change.error) : null)} />
        <div>
          <Button type="submit" isLoading={change.isPending} disabled={!current || !next}>
            Change password
          </Button>
        </div>
      </form>
    </Section>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-5">
        <ProfileSection user={user} />
        {user.role === "TENANT" && <TenantSection profile={user.tenantProfile} />}
        {user.role === "LANDLORD" && <LandlordSection user={user} />}
        <SecuritySection />
        <Section title="Appearance" description="Follow your device, or choose light or dark.">
          <ThemeToggle />
        </Section>
      </div>
    </>
  );
}
