// Checkout: review the cost, pay on Paystack in an in-app browser, then wait
// for confirmation. Local development uses the web simulator page instead.

import { Feather } from "@expo/vector-icons";
import { formatCurrency } from "@lettr/utils";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { CostBreakdown } from "../../components/listing";
import { Button, Card, COLORS, ErrorBox, ScreenHeader, Skeleton } from "../../components/ui";
import { useInitiatePayment, useListing, usePaymentStatus } from "../../hooks/data";
import { errorMessage } from "../../lib/api";

function Waiting({ paymentId, listingId }: { paymentId: string; listingId: string }) {
  const router = useRouter();
  const status = usePaymentStatus(paymentId);
  const s = status.data?.status ?? "PENDING";
  if (s === "IN_ESCROW" || s === "RELEASED") {
    return (
      <Card className="items-center gap-3">
        <Feather name="check-circle" size={44} color={COLORS.ok} />
        <Text className="font-display text-2xl text-ink">Payment received</Text>
        <Text className="text-center font-sans text-[15px] text-ink-2">Your money is safely in escrow{status.data?.receipt ? ` (receipt ${status.data.receipt.receiptNumber})` : ""}. Next, sign your agreement.</Text>
        <Button variant="accent" onPress={() => router.replace(status.data?.tenancyAgreement ? `/tenancy/${status.data.tenancyAgreement.id}` : "/rental")}>
          Sign the agreement
        </Button>
      </Card>
    );
  }
  if (s === "FAILED" || s === "REFUNDED") {
    return (
      <Card className="items-center gap-3">
        <Feather name="x-circle" size={44} color={COLORS.bad} />
        <Text className="font-display text-2xl text-ink">{s === "REFUNDED" ? "Payment refunded" : "Payment didn't go through"}</Text>
        <Button onPress={() => router.replace(`/pay/${listingId}`)}>Try again</Button>
      </Card>
    );
  }
  return (
    <Card className="items-center gap-3">
      <Feather name="clock" size={44} color={COLORS.navy} />
      <Text className="font-display text-2xl text-ink">Confirming your payment</Text>
      <Text className="text-center font-sans text-[15px] text-ink-2">Bank transfers can take a few minutes. We&apos;ll notify you when it&apos;s confirmed.</Text>
      <Button variant="secondary" loading={status.isFetching} onPress={() => status.refetch()}>
        Check again
      </Button>
    </Card>
  );
}

export default function PayScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const listing = useListing(listingId);
  const initiate = useInitiatePayment();
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const pay = () =>
    initiate.mutate(listingId, {
      onSuccess: async (session) => {
        setPaymentId(session.paymentId);
        await WebBrowser.openBrowserAsync(session.authorizationUrl, { dismissButtonStyle: "done" });
      },
    });

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title="Pay into escrow" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {paymentId ? (
          <Waiting paymentId={paymentId} listingId={listingId} />
        ) : listing.isPending ? (
          <Skeleton className="h-72" />
        ) : listing.isError || !listing.data ? (
          <ErrorBox message={errorMessage(listing.error, "This home isn't available.")} />
        ) : (
          <>
            <Card>
              <Text className="font-sans-bold text-[15px] text-ink">{listing.data.property.title}</Text>
              <Text className="mb-4 font-sans text-sm text-muted">
                Landlord {listing.data.landlord.firstName} {listing.data.landlord.lastName}
              </Text>
              <CostBreakdown cost={listing.data.moveInCost} />
            </Card>
            <Card className="gap-2">
              <Text className="font-sans text-sm text-ink-2">Lettr holds the money. The landlord is paid only after you confirm you have the keys, or 7 days after handover if you raise no problem.</Text>
              <Text className="font-sans text-sm text-ink-2">You&apos;ll pay on Paystack&apos;s secure page by card, transfer or USSD.</Text>
            </Card>
            {initiate.isError && <ErrorBox message={errorMessage(initiate.error)} />}
            <Button variant="accent" size="lg" loading={initiate.isPending} onPress={pay}>
              Pay {formatCurrency(listing.data.moveInCost.total)}
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
}
