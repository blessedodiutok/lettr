import { formatRelativeDate } from "@lettr/utils";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { EmptyState, ErrorBox, ScreenHeader, Skeleton } from "../components/ui";
import { useMarkNotificationsRead, useNotifications } from "../hooks/data";

function screenFor(link?: string) {
  if (!link) return null;
  const [, section, id] = link.split("/");
  if (section === "messages" && id) return `/messages/${id}`;
  if (section === "tenancies" && id) return `/tenancy/${id}`;
  if (section === "listings" && id) return `/listing/${id}`;
  if (link.includes("payouts") || link.includes("payments")) return "/payouts";
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotifications();
  const mark = useMarkNotificationsRead();
  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader
        title="Notifications"
        right={
          notifications.data?.unreadCount ? (
            <Pressable onPress={() => mark.mutate(undefined)} className="px-3">
              <Text className="font-sans-bold text-sm text-navy">Mark all read</Text>
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={notifications.data?.notifications ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={notifications.isRefetching} onRefresh={() => notifications.refetch()} />}
        ListEmptyComponent={
          notifications.isPending ? (
            <Skeleton className="h-20" />
          ) : notifications.isError ? (
            <ErrorBox message="We couldn't load notifications." onRetry={() => notifications.refetch()} />
          ) : (
            <EmptyState icon="bell" title="You're all caught up" />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!item.isRead) mark.mutate(item.id);
              const target = screenFor(item.data?.link);
              if (target) router.push(target as never);
            }}
            className={`flex-row gap-3 rounded-xl border border-line p-4 ${item.isRead ? "bg-surface" : "bg-navy-soft"}`}
          >
            <View className={`mt-1.5 h-2 w-2 rounded-full ${item.isRead ? "bg-transparent" : "bg-brass"}`} />
            <View className="flex-1">
              <Text className={`text-[15px] text-ink ${item.isRead ? "font-sans-medium" : "font-sans-bold"}`}>{item.title}</Text>
              <Text className="mt-0.5 font-sans text-sm text-ink-2">{item.body}</Text>
              <Text className="mt-1 font-sans text-xs text-muted">{formatRelativeDate(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
