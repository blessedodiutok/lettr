// File: apps/web/src/components/listing/NewListingWizard.tsx
// 6-step listing creation wizard for landlords

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { apiClient } from "../../lib/axios";
import { cn, formatNaira } from "../../lib/utils";
import { FormField } from "../auth/FormField";
import { Button } from "../ui/button";
import { Select } from "../ui/select";

// ── Step schemas ─────────────────────────────────────────────────────────────

const step1Schema = z.object({
  propertyType: z.string().min(1, "Select a property type"),
  address: z.string().min(5, "Full address is required"),
  neighbourhood: z.string().min(2, "Neighbourhood is required"),
  lga: z.string().min(2, "LGA is required"),
  state: z.string().min(2, "State is required"),
});

const step2Schema = z.object({
  annualRent: z.coerce.number().min(100000, "Minimum rent is ₦100,000"),
  cautionFee: z.coerce.number().min(0, "Must be zero or more"),
  availableFrom: z.string().min(1, "Available from date is required"),
  minimumLeaseTerm: z.coerce.number().int().min(1).max(36).default(12),
});

const step3Schema = z.object({
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(1).max(20),
  toilets: z.coerce.number().int().min(1).max(20),
  parkingSpaces: z.coerce.number().int().min(0).max(20).default(0),
  isFurnished: z.boolean().default(false),
  isServiced: z.boolean().default(false),
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

const PROPERTY_TYPES = [
  { value: "SELF_CONTAINED", label: "Self Contained" },
  { value: "MINI_FLAT", label: "Mini Flat" },
  { value: "ONE_BEDROOM", label: "1 Bedroom" },
  { value: "TWO_BEDROOM", label: "2 Bedroom" },
  { value: "THREE_BEDROOM", label: "3 Bedroom" },
  { value: "FOUR_BEDROOM", label: "4 Bedroom" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "BUNGALOW", label: "Bungalow" },
  { value: "BOYS_QUARTERS", label: "Boys' Quarters" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "TERRACE", label: "Terrace" },
];

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Rivers",
  "Kano",
  "Oyo",
  "Delta",
  "Anambra",
  "Enugu",
  "Imo",
  "Kaduna",
  "Ogun",
  "Edo",
  "Kwara",
  "Cross River",
  "Akwa Ibom",
];

const STEPS = [
  "Location",
  "Pricing",
  "Details",
  "Amenities",
  "Photos",
  "Preview",
];

const AMENITY_OPTIONS = [
  { value: "PREPAID_ELECTRICITY", label: "Prepaid electricity" },
  { value: "CONSTANT_ELECTRICITY", label: "Constant electricity" },
  { value: "WATER_SUPPLY", label: "Water supply" },
  { value: "BOREHOLE", label: "Borehole" },
  { value: "INTERNET_FIBRE", label: "Fibre internet" },
  { value: "SECURITY_GUARD", label: "Security guard" },
  { value: "CCTV", label: "CCTV" },
  { value: "GATED_ESTATE", label: "Gated estate" },
  { value: "PARKING_SPACE", label: "Parking space" },
  { value: "SWIMMING_POOL", label: "Swimming pool" },
  { value: "GYM", label: "Gym" },
  { value: "GENERATOR_COMMON", label: "Estate generator" },
  { value: "GENERATOR_PRIVATE", label: "Private generator" },
  { value: "AIR_CONDITIONING", label: "Air conditioning" },
  { value: "CEILING_FAN", label: "Ceiling fan" },
  { value: "GAS_COOKER", label: "Gas cooker point" },
  { value: "BALCONY", label: "Balcony" },
  { value: "GARDEN", label: "Garden" },
  { value: "SERVANTS_QUARTERS", label: "Servant's quarters" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function NewListingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1 | null>(null);
  const [step2Data, setStep2Data] = useState<Step2 | null>(null);
  const [step3Data, setStep3Data] = useState<Step3 | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);

  // Step forms — step2 and step3 use z.coerce.number() which causes a
  // TypeScript inference mismatch between the schema's input type (unknown)
  // and the desired output type. Casting to Resolver<T> is safe because
  // zodResolver does coerce and validate to the correct shape at runtime.
  const step1Form = useForm<Step1>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2>({
    resolver: zodResolver(step2Schema) as Resolver<Step2>,
  });
  const step3Form = useForm<Step3>({
    resolver: zodResolver(step3Schema) as Resolver<Step3>,
  });

  // Final submit mutation
  const createListing = useMutation({
    mutationFn: async () => {
      if (!step1Data || !step2Data || !step3Data) return;
      const payload = {
        property: {
          title: step3Data.title,
          description: step3Data.description,
          propertyType: step1Data.propertyType,
          address: step1Data.address,
          neighbourhood: step1Data.neighbourhood,
          lga: step1Data.lga,
          state: step1Data.state,
          bedrooms: step3Data.bedrooms,
          bathrooms: step3Data.bathrooms,
          toilets: step3Data.toilets,
          parkingSpaces: step3Data.parkingSpaces,
          isFurnished: step3Data.isFurnished,
          isServiced: step3Data.isServiced,
          amenities: selectedAmenities.map((type) => ({ type })),
        },
        listing: {
          annualRent: step2Data.annualRent,
          cautionFee: step2Data.cautionFee,
          availableFrom: new Date(step2Data.availableFrom).toISOString(),
          minimumLeaseTerm: step2Data.minimumLeaseTerm,
        },
      };
      const { data } = await apiClient.post("/api/listings", payload);
      return data.data;
    },
    onSuccess: (listing) => {
      router.push(`/landlord/dashboard?created=${listing?.id ?? ""}`);
    },
  });

  function toggleAmenity(value: string) {
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    );
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadedPhotos((prev) => [...prev, ...files].slice(0, 12));
    const urls = files.map((f) => URL.createObjectURL(f));
    setUploadedPhotoUrls((prev) => [...prev, ...urls].slice(0, 12));
  }

  // ── Render steps ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                  "transition-all duration-200",
                  i < step
                    ? "bg-brand-navy border-brand-navy text-white"
                    : i === step
                      ? "border-brand-navy text-brand-navy"
                      : "border-border text-muted-foreground",
                )}
              >
                {i < step ? (
                  <CheckCircle size={14} aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium hidden sm:block",
                  i === step ? "text-brand-navy" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-muted rounded-full">
          <div
            className="h-full bg-brand-navy rounded-full transition-all duration-300"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step panels */}
      <div className="bg-card rounded-2xl border border-border shadow-(--shadow-md) p-7">
        {/* ── Step 0: Location ────────────────────────────────────────── */}
        {step === 0 && (
          <form
            onSubmit={step1Form.handleSubmit((data) => {
              setStep1Data(data);
              setStep(1);
            })}
            className="space-y-5"
          >
            <div>
              <h2 className="heading-display text-xl text-brand-navy mb-1">
                Property type & location
              </h2>
              <p className="text-sm text-muted-foreground">
                Tell us what kind of property this is and where it's located.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Property type
              </label>
              <Select
                {...step1Form.register("propertyType")}
                error={!!step1Form.formState.errors.propertyType}
              >
                <option value="">Select type…</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              {step1Form.formState.errors.propertyType && (
                <p className="text-xs text-destructive mt-1">
                  {step1Form.formState.errors.propertyType.message}
                </p>
              )}
            </div>

            <FormField
              label="Full address"
              placeholder="15 Admiralty Way, Lekki Phase 1"
              error={step1Form.formState.errors.address?.message}
              {...step1Form.register("address")}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Neighbourhood"
                placeholder="Lekki Phase 1"
                error={step1Form.formState.errors.neighbourhood?.message}
                {...step1Form.register("neighbourhood")}
              />
              <FormField
                label="LGA"
                placeholder="Eti-Osa"
                error={step1Form.formState.errors.lga?.message}
                {...step1Form.register("lga")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                State
              </label>
              <Select
                {...step1Form.register("state")}
                error={!!step1Form.formState.errors.state}
              >
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Continue <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </form>
        )}

        {/* ── Step 1: Pricing ─────────────────────────────────────────── */}
        {step === 1 && (
          <form
            onSubmit={step2Form.handleSubmit((data) => {
              setStep2Data(data);
              setStep(2);
            })}
            className="space-y-5"
          >
            <div>
              <h2 className="heading-display text-xl text-brand-navy mb-1">
                Rent & lease terms
              </h2>
              <p className="text-sm text-muted-foreground">
                Annual rent only — Lettr never uses monthly pricing.
              </p>
            </div>

            <FormField
              label="Annual rent (₦)"
              type="number"
              placeholder="1500000"
              hint="Enter the full yearly rent amount in Naira"
              error={step2Form.formState.errors.annualRent?.message}
              {...step2Form.register("annualRent")}
            />

            <FormField
              label="Caution fee (₦)"
              type="number"
              placeholder="1500000"
              hint="Refundable security deposit — typically equal to one year's rent"
              error={step2Form.formState.errors.cautionFee?.message}
              {...step2Form.register("cautionFee")}
            />

            <FormField
              label="Available from"
              type="date"
              error={step2Form.formState.errors.availableFrom?.message}
              {...step2Form.register("availableFrom")}
            />

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Minimum lease term (months)
              </label>
              <Select {...step2Form.register("minimumLeaseTerm")}>
                {[6, 12, 18, 24, 36].map((m) => (
                  <option key={m} value={m}>
                    {m} months
                  </option>
                ))}
              </Select>
            </div>

            {/* Savings preview */}
            {step2Form.watch("annualRent") > 0 && (
              <div className="bg-(--color-success-50) border border-(--color-success-100) rounded-lg p-3">
                <p className="text-xs font-semibold text-(--color-success-700)">
                  Tenant saves{" "}
                  {formatNaira(Number(step2Form.watch("annualRent")) * 0.12)} vs
                  traditional agent
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setStep(0)}
              >
                <ChevronLeft size={16} aria-hidden="true" /> Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
              >
                Continue <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 2: Details ─────────────────────────────────────────── */}
        {step === 2 && (
          <form
            onSubmit={step3Form.handleSubmit((data) => {
              setStep3Data(data);
              setStep(3);
            })}
            className="space-y-5"
          >
            <div>
              <h2 className="heading-display text-xl text-brand-navy mb-1">
                Rooms & features
              </h2>
            </div>

            <FormField
              label="Listing title"
              placeholder="Spacious 3-Bedroom Flat in Lekki Phase 1"
              hint="Be specific — tenants search by type and area"
              error={step3Form.formState.errors.title?.message}
              {...step3Form.register("title")}
            />

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Description
              </label>
              <textarea
                {...step3Form.register("description")}
                rows={4}
                placeholder="Describe the property, its standout features, and the neighbourhood…"
                className="
                  w-full px-4 py-3 rounded-(--radius-md)
                  border border-border bg-white
                  text-sm text-foreground
                  placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  resize-none transition-colors duration-150
                "
              />
              {step3Form.formState.errors.description && (
                <p className="text-xs text-destructive mt-1">
                  {step3Form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "bedrooms" as const, label: "Bedrooms", min: 0 },
                { name: "bathrooms" as const, label: "Bathrooms", min: 1 },
                { name: "toilets" as const, label: "Toilets", min: 1 },
                {
                  name: "parkingSpaces" as const,
                  label: "Parking spaces",
                  min: 0,
                },
              ].map(({ name, label, min }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    {label}
                  </label>
                  <input
                    type="number"
                    min={min}
                    max={20}
                    defaultValue={min}
                    {...step3Form.register(name)}
                    className="
                      w-full h-10 px-3 rounded-(--radius-md) text-sm text-center
                      border border-border bg-white
                      focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    "
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-6">
              {[
                { name: "isFurnished" as const, label: "Furnished" },
                { name: "isServiced" as const, label: "Serviced estate" },
              ].map(({ name, label }) => (
                <label
                  key={name}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    {...step3Form.register(name)}
                    className="w-4 h-4 rounded accent-brand-navy"
                  />
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                <ChevronLeft size={16} /> Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
              >
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 3: Amenities ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="heading-display text-xl text-brand-navy mb-1">
                Amenities
              </h2>
              <p className="text-sm text-muted-foreground">
                Select everything that applies. Tenants filter by amenities.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map((amenity) => {
                const active = selectedAmenities.includes(amenity.value);
                return (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => toggleAmenity(amenity.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-(--radius-md)",
                      "text-sm font-medium text-left",
                      "border-2 transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-brand-navy bg-(--color-primary-50) text-(--color-primary-700)"
                        : "border-border bg-white text-foreground hover:border-(--color-primary-300)",
                    )}
                  >
                    <CheckCircle
                      size={14}
                      className={
                        active ? "text-brand-navy" : "text-transparent"
                      }
                      aria-hidden="true"
                    />
                    {amenity.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setStep(2)}
              >
                <ChevronLeft size={16} /> Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => setStep(4)}
              >
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Photos ──────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="heading-display text-xl text-brand-navy mb-1">
                Property photos
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload up to 12 photos. First photo becomes the cover image.
              </p>
            </div>

            {/* Upload area */}
            <label
              htmlFor="photo-upload"
              className="
                flex flex-col items-center justify-center
                border-2 border-dashed border-border
                rounded-xl p-8 cursor-pointer
                hover:border-(--color-primary-400) hover:bg-(--color-primary-50)
                transition-colors duration-150
              "
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-muted-foreground"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">
                Click to upload photos
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP — max 5MB each — up to 12 photos
              </p>
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoSelect}
                className="sr-only"
              />
            </label>

            {/* Preview grid */}
            {uploadedPhotoUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedPhotoUrls.map((url, i) => (
                  <div
                    key={url}
                    className="relative aspect-square rounded-(--radius-md) overflow-hidden border border-border"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-brand-navy text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        Cover
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedPhotos((p) => p.filter((_, j) => j !== i));
                        setUploadedPhotoUrls((p) =>
                          p.filter((_, j) => j !== i),
                        );
                      }}
                      aria-label={`Remove photo ${i + 1}`}
                      className="
                        absolute top-1 right-1
                        w-5 h-5 rounded-full
                        bg-black/60 text-white
                        flex items-center justify-center
                        hover:bg-black/80 transition-colors
                      "
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setStep(3)}
              >
                <ChevronLeft size={16} /> Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => setStep(5)}
              >
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Preview & publish ───────────────────────────────── */}
        {step === 5 && step1Data && step2Data && step3Data && (
          <div className="space-y-5">
            <div>
              <h2 className="heading-display text-xl text-brand-navy mb-1">
                Review & publish
              </h2>
              <p className="text-sm text-muted-foreground">
                Check everything looks right before going live.
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-muted rounded-xl p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {step1Data.propertyType.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-right">
                  {step1Data.neighbourhood}, {step1Data.state}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual rent</span>
                <span className="font-(family-name:--font-display) font-bold text-brand-navy">
                  {formatNaira(step2Data.annualRent)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Caution fee</span>
                <span className="font-medium">
                  {formatNaira(step2Data.cautionFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bedrooms</span>
                <span className="font-medium">{step3Data.bedrooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amenities</span>
                <span className="font-medium">
                  {selectedAmenities.length} selected
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Photos</span>
                <span className="font-medium">
                  {uploadedPhotos.length} uploaded
                </span>
              </div>
            </div>

            {/* Savings reminder */}
            <div className="bg-(--color-success-50) border border-(--color-success-100) rounded-lg p-4">
              <p className="text-sm font-semibold text-(--color-success-700)">
                🎉 Tenants save {formatNaira(step2Data.annualRent * 0.12)} in
                agent fees by renting through Lettr
              </p>
            </div>

            {createListing.isError && (
              <p className="text-sm text-destructive text-center">
                Something went wrong. Please try again.
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setStep(4)}
              >
                <ChevronLeft size={16} /> Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => createListing.mutate()}
                isLoading={createListing.isPending}
              >
                Publish listing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
