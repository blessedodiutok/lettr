import { useRouter } from "expo-router";
import { FlatList, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListingCard } from "../../components/listing";
import { Button, EmptyState, ErrorBox, Skeleton, Title } from "../../components/ui";
import { useSavedListings } from "../../hooks/data";

export default function SavedScreen() {
  const router = useRouter();
  const saved = useSavedListings();
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <FlatList
        data={saved.data ?? []}
        keyExtractor={(item) => item.listing.id}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={saved.isRefetching} onRefresh={() => saved.refetch()} />}
        ListHeaderComponent={<Title sub="Homes you've saved. A home disappears once it's let.">Saved homes</Title>}
        ListEmptyComponent={
          saved.isPending ? (
            <View className="gap-4">
              <Skeleton className="h-64" />
            </View>
          ) : saved.isError ? (
            <ErrorBox message="We couldn't load your saved homes." onRetry={() => saved.refetch()} />
          ) : (
            <EmptyState icon="heart" title="No saved homes yet" body="Tap the heart on any home to keep it here." action={<Button onPress={() => router.push("/")}>Browse homes</Button>} />
          )
        }
        renderItem={({ item }) => <ListingCard listing={item.listing} />}
      />
    </SafeAreaView>
  );
}
