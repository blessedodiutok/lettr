// Landlord listings. Creating and editing listings happens on the web in this
// phase (photo-heavy forms); here landlords see status, views and inquiries.

import { formatCurrency, optimizeImage } from "@lettr/utils";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, EmptyState, ErrorBox, Skeleton, StatusPill, Title } from "../../components/ui";
import { useMyListings } from "../../hooks/data";
import { WEB_URL } from "../../lib/api";

export default function LandlordListingsScreen() {
  const router = useRouter();
  const listings = useMyListings();
  const openEditor = (path: string) => WebBrowser.openBrowserAsync(`${WEB_URL}${path}`);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <FlatList
        data={listings.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        refreshControl={<RefreshControl refreshing={listings.isRefetching} onRefresh={() => listings.refetch()} />}
        ListHeaderComponent={
          <View className="mb-2">
            <Title sub="Create and edit listings on lettr.ng — photo uploads work best on a larger screen.">Listings</Title>
            <Button variant="secondary" icon="plus" onPress={() => openEditor("/landlord/listings/new")}>
              New listing on lettr.ng
            </Button>
          </View>
        }
        ListEmptyComponent={
          listings.isPending ? (
            <Skeleton className="h-24" />
          ) : listings.isError ? (
            <ErrorBox message="We couldn't load your listings." onRetry={() => listings.refetch()} />
          ) : (
            <EmptyState icon="home" title="No listings yet" body="List your first home on lettr.ng. It takes about ten minutes." />
          )
        }
        renderItem={({ item }) => {
          const cover = item.property.photos[0]?.url;
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push(`/listing/${item.id}`)} className="flex-row gap-3 rounded-xl border border-line bg-surface p-3">
              {cover ? <Image source={{ uri: optimizeImage(cover, 240) }} style={{ width: 88, height: 66, borderRadius: 8 }} contentFit="cover" /> : <View className="h-[66px] w-[88px] rounded-lg bg-surface-2" />}
              <View className="flex-1 gap-1">
                <Text numberOfLines={1} className="font-sans-bold text-[15px] text-ink">
                  {item.property.title}
                </Text>
                <Text className="font-sans text-[13px] text-muted">
                  {formatCurrency(item.annualRent)}/yr · {item.viewCount} views · {item.openInquiries ?? 0} open
                </Text>
                <StatusPill kind="listing" status={item.status} />
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
