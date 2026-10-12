import { Feather } from "@expo/vector-icons";
import { formatCurrency, formatCurrencyShort, formatPropertyType, getJourneySteps, type JourneyInput, type MoveInCost, optimizeImage } from "@lettr/utils";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useToggleSave } from "../hooks/data";
import type { Listing } from "../lib/types";
import { useAuthStore } from "../stores/auth";
import { COLORS } from "./ui";

export function SaveButton({ listing, size = 36 }: { listing: Pick<Listing, "id" | "isSaved">; size?: number }) {
  const router = useRouter();
  const { status, user } = useAuthStore();
  const toggle = useToggleSave();
  if (user && user.role !== "TENANT") return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listing.isSaved ? "Remove from saved homes" : "Save this home"}
      onPress={() => (status === "authenticated" ? toggle.mutate({ id: listing.id, saved: listing.isSaved }) : router.push("/(auth)/login"))}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-white"
    >
      <Feather name="heart" size={18} color={listing.isSaved ? COLORS.bad : "#34465A"} />
    </Pressable>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { property } = listing;
  const cover = property.photos.find((p) => p.isCover) ?? property.photos[0];
  const verified = listing.landlord.landlordProfile?.verificationStatus === "VERIFIED";
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/listing/${listing.id}`)} className="overflow-hidden rounded-xl border border-line bg-surface active:opacity-90">
      <View className="relative">
        {cover ? (
          <Image source={{ uri: optimizeImage(cover.url, 720) }} style={{ width: "100%", aspectRatio: 16 / 10 }} contentFit="cover" transition={150} />
        ) : (
          <View style={{ aspectRatio: 16 / 10 }} className="items-center justify-center bg-surface-2">
            <Feather name="image" size={28} color={COLORS.muted} />
          </View>
        )}
        <View className="absolute right-2.5 top-2.5">
          <SaveButton listing={listing} />
        </View>
        {verified && (
          <View className="absolute bottom-2.5 left-2.5 flex-row items-center gap-1 rounded-full bg-white px-2.5 py-1">
            <Feather name="shield" size={12} color={COLORS.ok} />
            <Text className="font-sans-bold text-xs text-ok">ID verified</Text>
          </View>
        )}
      </View>
      <View className="p-4">
        <Text numberOfLines={1} className="font-sans-bold text-[15px] text-ink">
          {property.title}
        </Text>
        <Text className="mt-0.5 font-sans text-[13px] text-muted">
          {property.neighbourhood} · {property.lga}
        </Text>
        <Text className="mt-2 font-sans text-[13px] text-ink-2">
          {[formatPropertyType(property.propertyType), property.bedrooms ? `${property.bedrooms} bed` : null, `${property.bathrooms} bath`].filter(Boolean).join(" · ")}
        </Text>
        <View className="mt-3 flex-row items-baseline justify-between">
          <Text className="font-sans-bold text-lg text-ink">
            {formatCurrency(listing.annualRent)}
            <Text className="font-sans text-[13px] text-muted"> /yr</Text>
          </Text>
          <Text className="font-sans text-xs text-muted">Move in {formatCurrencyShort(listing.moveInCost.total)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function CostBreakdown({ cost }: { cost: MoveInCost }) {
  const rows: Array<[string, number]> = [
    ["Annual rent", cost.annualRent],
    ["Caution fee (refundable)", cost.cautionFee],
    ...(cost.serviceCharge ? ([["Service charge", cost.serviceCharge]] as Array<[string, number]>) : []),
    ...(cost.legalFee ? ([["Legal fee", cost.legalFee]] as Array<[string, number]>) : []),
    ["Lettr fee (3%)", cost.platformFee],
  ];
  return (
    <View className="gap-2">
      {rows.map(([label, value]) => (
        <View key={label} className="flex-row justify-between">
          <Text className="font-sans text-sm text-ink-2">{label}</Text>
          <Text className="font-sans text-sm text-ink">{formatCurrency(value)}</Text>
        </View>
      ))}
      <View className="mt-1 flex-row justify-between border-t border-line pt-3">
        <Text className="font-sans-bold text-[15px] text-ink">Total to move in</Text>
        <Text className="font-sans-bold text-[15px] text-ink">{formatCurrency(cost.total)}</Text>
      </View>
      {cost.netSaving > 0 && (
        <View className="mt-2 rounded-lg bg-ok-soft px-3 py-2.5">
          <Text className="font-sans-bold text-[13px] text-ok">You save {formatCurrency(cost.netSaving)} compared with a 15% agent fee.</Text>
        </View>
      )}
    </View>
  );
}

/** Vertical version of the six-step rental journey. */
export function JourneySteps({ input }: { input: JourneyInput }) {
  const steps = getJourneySteps(input);
  return (
    <View accessibilityLabel="Rental progress" className="gap-2.5">
      {steps.map((step) => (
        <View key={step.key} className="flex-row items-center gap-3" accessibilityLabel={`${step.label}: ${step.state}`}>
          <View
            className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
              step.state === "done" ? "border-navy bg-navy" : step.state === "current" ? "border-brass bg-brass-soft" : "border-line-strong bg-surface"
            }`}
          >
            {step.state === "done" && <Feather name="check" size={11} color="#fff" />}
          </View>
          <Text className={`font-sans-medium text-sm ${step.state === "upcoming" ? "text-muted" : "text-ink"}`}>{step.label}</Text>
        </View>
      ))}
    </View>
  );
}
