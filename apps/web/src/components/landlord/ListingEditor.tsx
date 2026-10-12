"use client";

// Create or edit a listing. Details are saved as a draft first; photos and
// publishing come after, because uploads need the property to exist.

import { AMENITY_GROUPS, LAUNCH_STATES, NIGERIAN_STATES, PROPERTY_TYPE_LABELS } from "@lettr/types";
import { calculateMoveInCost } from "@lettr/utils";
import { CreateListingSchema } from "@lettr/zod-schemas";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCreateListing, useListingStatusAction, useUpdateListing } from "../../hooks/useListings";
import { errorCode, errorMessage } from "../../lib/api";
import { cn } from "../../lib/cn";
import type { Listing } from "../../lib/types";
import { useAuthStore } from "../../stores/authStore";
import { toast } from "../../stores/toastStore";
import { FormError } from "../auth/AuthHeading";
import { CostBreakdown } from "../listings/CostBreakdown";
import { Button } from "../ui/button";
import { Card, StatusPill } from "../ui/display";
import { Checkbox, Field, Input, Select, Textarea } from "../ui/field";
import { PhotoManager } from "./PhotoManager";

interface FormState {
  title: string;
  description: string;
  propertyType: string;
  address: string;
  neighbourhood: string;
  lga: string;
  state: string;
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  parkingSpaces: string;
  sizeInSqm: string;
  isFurnished: boolean;
  isServiced: boolean;
  isNewBuild: boolean;
  amenities: string[];
  annualRent: string;
  cautionFee: string;
  serviceCharge: string;
  legalFee: string;
  availableFrom: string;
  minimumLeaseTerm: string;
  maximumOccupants: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  requiresEmployment: boolean;
  requiresGuarantor: boolean;
  additionalRequirements: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function fromListing(listing?: Listing): FormState {
  const p = listing?.property;
  return {
    title: p?.title ?? "",
    description: p?.description ?? "",
    propertyType: p?.propertyType ?? "",
    address: p?.address ?? "",
    neighbourhood: p?.neighbourhood ?? "",
    lga: p?.lga ?? "",
    state: p?.state ?? "Lagos",
    bedrooms: String(p?.bedrooms ?? 1),
    bathrooms: String(p?.bathrooms ?? 1),
    toilets: String(p?.toilets ?? 1),
    parkingSpaces: String(p?.parkingSpaces ?? 0),
    sizeInSqm: p?.sizeInSqm ? String(p.sizeInSqm) : "",
    isFurnished: p?.isFurnished ?? false,
    isServiced: p?.isServiced ?? false,
    isNewBuild: p?.isNewBuild ?? false,
    amenities: p?.amenities.map((a) => a.type) ?? [],
    annualRent: listing ? String(listing.annualRent) : "",
    cautionFee: listing ? String(listing.cautionFee) : "",
    serviceCharge: listing?.serviceCharge ? String(listing.serviceCharge) : "",
    legalFee: listing?.legalFee ? String(listing.legalFee) : "",
    availableFrom: listing ? listing.availableFrom.slice(0, 10) : today(),
    minimumLeaseTerm: String(listing?.minimumLeaseTerm ?? 12),
    maximumOccupants: listing?.maximumOccupants ? String(listing.maximumOccupants) : "",
    petsAllowed: listing?.petsAllowed ?? false,
    smokingAllowed: listing?.smokingAllowed ?? false,
    requiresEmployment: listing?.requiresEmployment ?? false,
    requiresGuarantor: listing?.requiresGuarantor ?? false,
    additionalRequirements: listing?.additionalRequirements ?? "",
  };
}

const num = (v: string) => Number(v.replace(/[^\d.]/g, ""));
const optionalNum = (v: string) => (v.trim() ? num(v) : undefined);

function toPayload(f: FormState) {
  return {
    property: {
      title: f.title,
      description: f.description,
      propertyType: f.propertyType,
      address: f.address,
      neighbourhood: f.neighbourhood,
      lga: f.lga,
      state: f.state,
      bedrooms: num(f.bedrooms),
      bathrooms: num(f.bathrooms),
      toilets: num(f.toilets),
      parkingSpaces: num(f.parkingSpaces || "0"),
      sizeInSqm: optionalNum(f.sizeInSqm),
      isFurnished: f.isFurnished,
      isServiced: f.isServiced,
      isNewBuild: f.isNewBuild,
      amenities: f.amenities.map((type) => ({ type })),
    },
    listing: {
      annualRent: num(f.annualRent),
      cautionFee: num(f.cautionFee || "0"),
      serviceCharge: num(f.serviceCharge || "0"),
      legalFee: num(f.legalFee || "0"),
      availableFrom: new Date(`${f.availableFrom}T00:00:00`).toISOString(),
      minimumLeaseTerm: num(f.minimumLeaseTerm),
      maximumOccupants: optionalNum(f.maximumOccupants),
      petsAllowed: f.petsAllowed,
      smokingAllowed: f.smokingAllowed,
      requiresEmployment: f.requiresEmployment,
      requiresGuarantor: f.requiresGuarantor,
      additionalRequirements: f.additionalRequirements.trim() || undefined,
    },
  };
}

function Section({ step, title, description, children }: { step: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-5 flex gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-soft text-[13px] font-bold text-navy">{step}</span>
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

export function ListingEditor({ listing }: { listing?: Listing }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<FormState>(() => fromListing(listing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateListing();
  const update = useUpdateListing(listing?.id ?? "");
  const statusAction = useListingStatusAction();
  const saving = create.isPending || update.isPending;
  const committed = listing && ["UNDER_OFFER", "TAKEN"].includes(listing.status);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, e.target.value as never),
  });
  const err = (path: string) => errors[path];

  const preview = useMemo(() => {
    const rent = num(form.annualRent);
    return rent >= 100000 ? calculateMoveInCost({ annualRent: rent, cautionFee: num(form.cautionFee || "0"), serviceCharge: num(form.serviceCharge || "0"), legalFee: num(form.legalFee || "0") }) : null;
  }, [form.annualRent, form.cautionFee, form.serviceCharge, form.legalFee]);

  const save = () => {
    const payload = toPayload(form);
    const parsed = CreateListingSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      toast.error("Check the highlighted fields.");
      return;
    }
    setErrors({});
    const body = committed ? { property: payload.property } : payload;
    if (listing) {
      update.mutate(body, { onSuccess: () => toast.success("Changes saved"), onError: (e) => toast.error(errorMessage(e)) });
    } else {
      create.mutate(payload, {
        onSuccess: (created) => {
          toast.success("Draft saved — now add photos");
          router.replace(`/landlord/listings/${created.id}/edit#photos`);
        },
        onError: (e) => toast.error(errorMessage(e)),
      });
    }
  };

  const verification = user?.landlordProfile?.verificationStatus;
  const needsVerification = verification !== "VERIFIED" && verification !== "PENDING_REVIEW";
  const photoCount = listing?.property.photos.length ?? 0;
  const canPublish = listing && ["DRAFT", "ARCHIVED"].includes(listing.status);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="grid min-w-0 gap-5">
        <Section step={1} title="The home" description="What it is and where it is.">
          <div className="grid gap-4">
            <Field label="Listing title" hint="e.g. Bright 2-bedroom flat near Admiralty Way" error={err("property.title")}>
              <Input {...text("title")} maxLength={120} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Home type" error={err("property.propertyType")}>
                <Select {...text("propertyType")}>
                  <option value="">Choose…</option>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="State" error={err("property.state")}>
                <Select {...text("state")}>
                  {[...LAUNCH_STATES, ...NIGERIAN_STATES.filter((s) => !LAUNCH_STATES.includes(s))].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Street address" hint="Only shown to tenants once they've paid." error={err("property.address")}>
              <Input {...text("address")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Neighbourhood" hint="e.g. Lekki Phase 1, Yaba, Wuse 2" error={err("property.neighbourhood")}>
                <Input {...text("neighbourhood")} />
              </Field>
              <Field label="Local government area" hint="e.g. Eti-Osa" error={err("property.lga")}>
                <Input {...text("lga")} />
              </Field>
            </div>
            <Field label="Description" hint={`${form.description.trim().length}/2000 · at least 50 characters. Mention power, water, security and what's nearby.`} error={err("property.description")}>
              <Textarea rows={6} {...text("description")} maxLength={2000} />
            </Field>
          </div>
        </Section>

        <Section step={2} title="Rooms and features">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Bedrooms" error={err("property.bedrooms")}>
                <Input type="number" min={0} max={20} {...text("bedrooms")} />
              </Field>
              <Field label="Bathrooms" error={err("property.bathrooms")}>
                <Input type="number" min={1} max={20} {...text("bathrooms")} />
              </Field>
              <Field label="Toilets" error={err("property.toilets")}>
                <Input type="number" min={1} max={20} {...text("toilets")} />
              </Field>
              <Field label="Parking" error={err("property.parkingSpaces")}>
                <Input type="number" min={0} max={20} {...text("parkingSpaces")} />
              </Field>
            </div>
            <Field label="Size in m²" optional>
              <Input inputMode="decimal" {...text("sizeInSqm")} className="max-w-40" />
            </Field>
            <div className="flex flex-wrap gap-x-6">
              <Checkbox label="Furnished" checked={form.isFurnished} onChange={(e) => set("isFurnished", e.target.checked)} />
              <Checkbox label="Serviced" checked={form.isServiced} onChange={(e) => set("isServiced", e.target.checked)} />
              <Checkbox label="New build" checked={form.isNewBuild} onChange={(e) => set("isNewBuild", e.target.checked)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {AMENITY_GROUPS.map((group) => (
                <fieldset key={group.label}>
                  <legend className="mb-2 text-sm font-semibold text-ink">{group.label}</legend>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      const on = form.amenities.includes(item.type);
                      return (
                        <button
                          key={item.type}
                          type="button"
                          aria-pressed={on}
                          onClick={() => set("amenities", on ? form.amenities.filter((a) => a !== item.type) : [...form.amenities, item.type])}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-medium",
                            on ? "border-navy bg-navy-soft text-navy" : "border-line-strong bg-surface text-ink-2 hover:border-navy",
                          )}
                        >
                          {on && <Check className="size-3.5" aria-hidden />}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>
        </Section>

        <Section step={3} title="Rent and terms" description={committed ? "Rent and dates are locked while a tenant is committed to this home." : "Annual amounts in naira. Tenants see the full total before paying."}>
          <fieldset disabled={committed} className="grid gap-4 disabled:opacity-60">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Annual rent" error={err("listing.annualRent")}>
                <Input prefix="₦" inputMode="numeric" {...text("annualRent")} />
              </Field>
              <Field label="Caution fee" hint="Refundable deposit" error={err("listing.cautionFee")}>
                <Input prefix="₦" inputMode="numeric" {...text("cautionFee")} />
              </Field>
              <Field label="Service charge" optional>
                <Input prefix="₦" inputMode="numeric" {...text("serviceCharge")} />
              </Field>
              <Field label="Legal fee" optional>
                <Input prefix="₦" inputMode="numeric" {...text("legalFee")} />
              </Field>
              <Field label="Available from" error={err("listing.availableFrom")}>
                <Input type="date" min={listing ? undefined : today()} {...text("availableFrom")} />
              </Field>
              <Field label="Minimum lease">
                <Select {...text("minimumLeaseTerm")}>
                  {[6, 12, 18, 24, 36].map((m) => (
                    <option key={m} value={m}>
                      {m} months
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-1">
              <Checkbox label="Pets allowed" checked={form.petsAllowed} onChange={(e) => set("petsAllowed", e.target.checked)} />
              <Checkbox label="Smoking allowed indoors" checked={form.smokingAllowed} onChange={(e) => set("smokingAllowed", e.target.checked)} />
              <Checkbox label="Tenant must show proof of income" checked={form.requiresEmployment} onChange={(e) => set("requiresEmployment", e.target.checked)} />
              <Checkbox label="Guarantor required" checked={form.requiresGuarantor} onChange={(e) => set("requiresGuarantor", e.target.checked)} />
            </div>
            <Field label="Other requirements" optional>
              <Textarea rows={2} {...text("additionalRequirements")} maxLength={500} />
            </Field>
          </fieldset>
        </Section>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" isLoading={saving} onClick={save}>
            {listing ? "Save changes" : "Save and add photos"}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/landlord/listings">Cancel</Link>
          </Button>
        </div>
        <FormError message={create.isError ? errorMessage(create.error) : update.isError ? errorMessage(update.error) : null} />

        {listing && (
          <section id="photos" className="scroll-mt-24">
            <Section step={4} title="Photos" description="Wide, bright photos of every room. The first photo is the cover tenants see in search.">
              <PhotoManager propertyId={listing.propertyId} photos={listing.property.photos} />
            </Section>
          </section>
        )}
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24">
        {listing && (
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Status</h2>
              <StatusPill kind="listing" status={listing.status} />
            </div>
            {canPublish && (
              <>
                <ul className="mt-4 grid gap-2 text-sm">
                  <li className={photoCount ? "text-ok" : "text-muted"}>{photoCount ? "✓" : "○"} At least one photo</li>
                  <li className={!needsVerification ? "text-ok" : "text-muted"}>
                    {!needsVerification ? "✓" : "○"} ID submitted for verification{" "}
                    {needsVerification && (
                      <Link href="/landlord/verification" className="font-semibold text-navy hover:underline">
                        Verify now
                      </Link>
                    )}
                  </li>
                </ul>
                <Button
                  className="mt-4"
                  block
                  variant="accent"
                  disabled={!photoCount || needsVerification}
                  isLoading={statusAction.isPending}
                  onClick={() =>
                    statusAction.mutate(
                      { id: listing.id, action: "publish" },
                      { onError: (e) => errorCode(e) === "VERIFICATION_REQUIRED" && router.push("/landlord/verification") },
                    )
                  }
                >
                  Publish listing
                </Button>
              </>
            )}
            {listing.status === "ACTIVE" && (
              <div className="mt-4 grid gap-2">
                <Button asChild variant="secondary" block>
                  <Link href={`/listings/${listing.id}`}>View live listing</Link>
                </Button>
                <Button variant="ghost" block isLoading={statusAction.isPending} onClick={() => statusAction.mutate({ id: listing.id, action: "archive" })}>
                  Take off the market
                </Button>
              </div>
            )}
            {listing.status === "SUSPENDED" && <p className="mt-3 text-sm text-bad">Lettr suspended this listing. Contact support to reinstate it.</p>}
            {committed && <p className="mt-3 text-sm text-muted">A tenant has accepted or paid for this home.</p>}
          </Card>
        )}
        {preview && (
          <Card>
            <h2 className="mb-3 font-semibold text-ink">What tenants will pay</h2>
            <CostBreakdown cost={preview} showSaving={false} />
            <p className="mt-3 text-[13px] text-muted">You receive everything except Lettr&apos;s 3% fee, paid out when the tenant moves in.</p>
          </Card>
        )}
      </aside>
    </div>
  );
}
