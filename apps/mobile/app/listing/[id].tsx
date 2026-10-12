import { AMENITY_LABELS } from "@lettr/types";
import { formatCurrency, formatDate, formatPropertyType, optimizeImage, pluralise } from "@lettr/utils";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormError } from "../../components/AuthScreen";
import { CostBreakdown, SaveButton } from "../../components/listing";
import { Avatar, Button, Card, ErrorBox, ScreenHeader, Skeleton, StatusPill } from "../../components/ui";
import { useCreateInquiry, useInquiryForListing, useListing } from "../../hooks/data";
import { errorCode, errorData, errorMessage } from "../../lib/api";
import type { Listing } from "../../lib/types";
import { useAuthStore } from "../../stores/auth";

const WIDTH = Dimensions.get("window").width;

function Gallery({ listing }: { listing: Listing }) {
  const [index, setIndex] = useState(0);
  const photos = [...listing.property.photos].sort((a, b) => a.displayOrder - b.displayOrder);
  if (!photos.length) return <View style={{ height: WIDTH * 0.66 }} className="bg-surface-2" />;
  return (
    <View>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.id}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / WIDTH))}
        renderItem={({ item }) => (
          <Image source={{ uri: optimizeImage(item.url, 1080) }} style={{ width: WIDTH, height: WIDTH * 0.72 }} contentFit="cover" accessibilityLabel={item.altText ?? listing.property.title} />
        )}
      />
      <View className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1">
        <Text className="font-sans-bold text-xs text-white">
          {index + 1} / {photos.length}
        </Text>
      </View>
      <View className="absolute right-3 top-3">
        <SaveButton listing={listing} />
      </View>
    </View>
  );
}

function Composer({ listing, open, onClose }: { listing: Listing; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const create = useCreateInquiry();
  const [message, setMessage] = useState(`Hello ${listing.landlord.firstName}, I'm interested in ${listing.property.title}. Is it still available, and when could I come to see it?`);
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/40">
        <View style={{ paddingBottom: insets.bottom + 16 }} className="gap-3 rounded-t-3xl bg-surface p-5">
          <Text className="font-display text-2xl text-ink">Message {listing.landlord.firstName}</Text>
          <Text className="font-sans text-sm text-muted">Introduce yourself — landlords reply faster when they know who you are.</Text>
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            maxLength={1000}
            accessibilityLabel="Your message"
            className="min-h-[140px] rounded-lg border border-line-strong p-3 font-sans text-[15px] text-ink"
            style={{ textAlignVertical: "top" }}
          />
          <FormError message={create.isError && errorCode(create.error) !== "INQUIRY_EXISTS" ? errorMessage(create.error) : null} />
          <View className="flex-row gap-2">
            <Button className="flex-1" variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={create.isPending}
              disabled={message.trim().length < 20}
              onPress={() =>
                create.mutate(
                  { listingId: listing.id, message: message.trim() },
                  {
                    onSuccess: (thread) => {
                      onClose();
                      router.push(`/messages/${thread.id}`);
                    },
                    onError: (e) => {
                      const existing = errorData<{ inquiryId: string }>(e);
                      if (existing) {
                        onClose();
                        router.push(`/messages/${existing.inquiryId}`);
                      }
                    },
                  },
                )
              }
            >
              Send
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ActionBar({ listing }: { listing: Listing }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, user } = useAuthStore();
  const tenant = user?.role === "TENANT";
  const thread = useInquiryForListing(listing.id, status === "authenticated" && tenant);
  const [composing, setComposing] = useState(false);

  let action: React.ReactNode;
  if (status !== "authenticated") {
    action = <Button onPress={() => router.push("/(auth)/signup")}>Message {listing.landlord.firstName}</Button>;
  } else if (!tenant) {
    action = null;
  } else if (thread.isPending) {
    action = <Skeleton className="h-11 w-40" />;
  } else {
    const inquiry = thread.data;
    const closed = !inquiry || ["DECLINED", "EXPIRED"].includes(inquiry.status);
    if (closed) {
      action = listing.status === "ACTIVE" ? <Button onPress={() => setComposing(true)}>Message {listing.landlord.firstName}</Button> : <Text className="font-sans text-sm text-muted">No longer available</Text>;
    } else if (inquiry.tenancy) {
      action = <Button onPress={() => router.push(`/tenancy/${inquiry.tenancy!.id}`)}>Your tenancy</Button>;
    } else if (inquiry.status === "ACCEPTED") {
      action = (
        <Button variant="accent" onPress={() => router.push(`/pay/${listing.id}`)}>
          Pay into escrow
        </Button>
      );
    } else {
      action = (
        <Button variant={inquiry.status === "OFFER_MADE" ? "accent" : "primary"} onPress={() => router.push(`/messages/${inquiry.id}`)}>
          {inquiry.status === "OFFER_MADE" ? "Review offer" : "Open chat"}
        </Button>
      );
    }
  }

  return (
    <View style={{ paddingBottom: insets.bottom + 12 }} className="flex-row items-center justify-between gap-3 border-t border-line bg-surface px-4 pt-3">
      <View>
        <Text className="font-sans-bold text-lg text-ink">
          {formatCurrency(listing.annualRent)}
          <Text className="font-sans text-xs text-muted"> /yr</Text>
        </Text>
        <Text className="font-sans text-xs text-muted">No agent fee</Text>
      </View>
      {action}
      <Composer listing={listing} open={composing} onClose={() => setComposing(false)} />
    </View>
  );
}

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = useListing(id);

  if (listing.isPending) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader />
        <Skeleton className="h-72 rounded-none" />
      </View>
    );
  }
  if (listing.isError || !listing.data) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader />
        <View className="p-4">
          <ErrorBox message={errorMessage(listing.error, "This home isn't available.")} />
        </View>
      </View>
    );
  }

  const l = listing.data;
  const p = l.property;
  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title={p.neighbourhood} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Gallery listing={l} />
        <View className="gap-5 p-4">
          <View className="gap-1.5">
            {l.status !== "ACTIVE" && <StatusPill kind="listing" status={l.status} />}
            <Text className="font-display text-[28px] leading-[34px] text-ink">{p.title}</Text>
            <Text className="font-sans text-[15px] text-muted">
              {formatPropertyType(p.propertyType)} · {p.neighbourhood}, {p.lga}, {p.state}
            </Text>
            <Text className="font-sans text-sm text-ink-2">
              {[p.bedrooms ? pluralise(p.bedrooms, "bedroom", "bedrooms") : null, pluralise(p.bathrooms, "bathroom", "bathrooms"), `Available ${formatDate(l.availableFrom)}`].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <Card>
            <Text className="mb-3 font-sans-bold text-base text-ink">What you&apos;ll pay</Text>
            <CostBreakdown cost={l.moveInCost} />
            <Text className="mt-3 font-sans text-[13px] text-muted">Payment opens when the landlord offers you the home. Paystack holds your money until you confirm you have the keys.</Text>
          </Card>
          <View className="gap-2">
            <Text className="font-sans-bold text-base text-ink">About this home</Text>
            <Text className="font-sans text-[15px] leading-6 text-ink-2">{p.description}</Text>
          </View>
          {p.amenities.length > 0 && (
            <View className="gap-2">
              <Text className="font-sans-bold text-base text-ink">What&apos;s included</Text>
              <Text className="font-sans text-[15px] leading-6 text-ink-2">
                {p.amenities.map((a) => AMENITY_LABELS[a.type as keyof typeof AMENITY_LABELS] ?? a.type).join(" · ")}
              </Text>
            </View>
          )}
          <Card className="flex-row items-center gap-3">
            <Avatar person={l.landlord} size={44} />
            <View className="flex-1">
              <Text className="font-sans-bold text-[15px] text-ink">
                {l.landlord.firstName} {l.landlord.lastName}
              </Text>
              <Text className="font-sans text-[13px] text-muted">
                {l.landlord.landlordProfile?.verificationStatus === "VERIFIED" ? "ID verified · " : ""}
                {l.landlord.landlordProfile?.totalRentalsCompleted ?? 0} tenancies on Lettr
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
      <ActionBar listing={l} />
    </View>
  );
}
