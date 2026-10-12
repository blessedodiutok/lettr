// File: apps/mobile/app/(tabs)/messages.tsx
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyState";
import { SkeletonCard } from "../../components/SkeletonCard";
import { apiClient } from "../../lib/axios";
import { formatDate } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";

interface InquiryThread {
  id: string;
  status: string;
  updatedAt: string;
  listing: {
    property: { title: string; neighbourhood: string; state: string };
  };
  tenant: { firstName: string; lastName: string };
  landlord: { firstName: string; lastName: string };
  messages: Array<{ message: string; sentAt: string }>;
}

export default function MessagesScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const { data, isLoading } = useQuery<InquiryThread[]>({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const res = await apiClient.get("/api/inquiries/my");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top"]}>
        <EmptyState
          icon="message-circle"
          title="Your messages"
          description="Log in to view your conversations with landlords."
          ctaLabel="Log in"
          onCtaPress={() => router.push("/(auth)/login")}
        />
      </SafeAreaView>
    );
  }

  const lastMessage = (thread: InquiryThread) =>
    thread.messages[thread.messages.length - 1];

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top"]}>
      <View className="px-4 pt-4 pb-2">
        <Text
          className="text-2xl text-[#1A3C5E]"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          Messages
        </Text>
      </View>

      {isLoading ? (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : !data?.length ? (
        <EmptyState
          icon="message-circle"
          title="No conversations yet"
          description="Send an inquiry on any listing to start a conversation."
          ctaLabel="Browse listings"
          onCtaPress={() => router.push("/(tabs)")}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-8"
          renderItem={({ item }) => {
            const other =
              user?.role === "TENANT"
                ? `${item.landlord.firstName} ${item.landlord.lastName}`
                : `${item.tenant.firstName} ${item.tenant.lastName}`;
            const last = lastMessage(item);

            return (
              <TouchableOpacity
                onPress={() => router.push(`/messages/${item.id}`)}
                className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-3 flex-row items-center gap-3"
                activeOpacity={0.8}
              >
                <View className="w-11 h-11 bg-[#EEF3F8] rounded-full items-center justify-center flex-shrink-0">
                  <Text className="text-[#1A3C5E] font-bold text-base">
                    {other.charAt(0)}
                  </Text>
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row justify-between items-center mb-0.5">
                    <Text
                      className="text-sm font-bold text-[#1E293B]"
                      style={{ fontFamily: "DMSans_700Bold" }}
                    >
                      {other}
                    </Text>
                    {last && (
                      <Text className="text-xs text-[#94A3B8]">
                        {formatDate(last.sentAt)}
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs text-[#64748B]" numberOfLines={1}>
                    {item.listing.property.title}
                  </Text>
                  {last && (
                    <Text
                      className="text-xs text-[#94A3B8] mt-0.5"
                      numberOfLines={1}
                    >
                      {last.message}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
