import { formatRelativeDate } from "@lettr/utils";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, EmptyState, ErrorBox, Skeleton, StatusPill, Title } from "../../components/ui";
import { useInquiries } from "../../hooks/data";
import { useAuthStore } from "../../stores/auth";

export default function MessagesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const inquiries = useInquiries("active");
  const landlord = user?.role === "LANDLORD";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <FlatList
        data={inquiries.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={inquiries.isRefetching} onRefresh={() => inquiries.refetch()} />}
        ListHeaderComponent={<Title sub={landlord ? "Tenants interested in your homes." : "Your conversations with landlords."}>{landlord ? "Inquiries" : "Messages"}</Title>}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          inquiries.isPending ? (
            <Skeleton className="h-20" />
          ) : inquiries.isError ? (
            <ErrorBox message="We couldn't load conversations." onRetry={() => inquiries.refetch()} />
          ) : (
            <EmptyState icon="message-circle" title="No conversations yet" body={landlord ? "When tenants message you, it appears here." : "Find a home and message the landlord."} />
          )
        }
        renderItem={({ item }) => {
          const other = landlord ? item.tenant : item.landlord;
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push(`/messages/${item.id}`)} className="flex-row items-center gap-3 rounded-xl border border-line bg-surface p-3.5 active:opacity-80">
              <Avatar person={other} size={44} />
              <View className="flex-1">
                <View className="flex-row items-center justify-between gap-2">
                  <Text numberOfLines={1} className={`flex-1 text-[15px] text-ink ${item.unreadCount ? "font-sans-bold" : "font-sans-medium"}`}>
                    {other.firstName} {other.lastName}
                  </Text>
                  <Text className="font-sans text-xs text-muted">{formatRelativeDate(item.updatedAt).replace("about ", "")}</Text>
                </View>
                <Text numberOfLines={1} className="font-sans text-[13px] text-muted">
                  {item.listing.property.title}
                </Text>
                <View className="mt-1 flex-row items-center justify-between gap-2">
                  <Text numberOfLines={1} className={`flex-1 text-[13px] ${item.unreadCount ? "font-sans-bold text-ink" : "font-sans text-ink-2"}`}>
                    {item.lastMessage ? `${item.lastMessage.senderId === user?.id ? "You: " : ""}${item.lastMessage.body}` : ""}
                  </Text>
                  <StatusPill kind="inquiry" status={item.status} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
