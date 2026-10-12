// File: apps/mobile/app/messages/[id].tsx
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "../../lib/axios";
import { formatDate } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";

interface Message {
  senderId: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

interface InquiryDetail {
  id: string;
  messages: Message[];
  tenant: { id: string; firstName: string; lastName: string };
  landlord: { id: string; firstName: string; lastName: string };
  listing: { property: { title: string } };
}

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: inquiry, isLoading } = useQuery<InquiryDetail>({
    queryKey: ["inquiry", id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/inquiries/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiClient.post(`/api/inquiries/${id}/message`, {
        message: text,
      });
      return res.data.data;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["inquiry", id] });
    },
  });

  function handleSend() {
    if (!message.trim()) return;
    sendMessage.mutate(message.trim());
  }

  const other = inquiry
    ? user?.id === inquiry.tenant.id
      ? inquiry.landlord
      : inquiry.tenant
    : null;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-[#E2E8F0] gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A3C5E" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            className="font-bold text-[#1E293B]"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            {other ? `${other.firstName} ${other.lastName}` : "…"}
          </Text>
          <Text className="text-xs text-[#64748B]" numberOfLines={1}>
            {inquiry?.listing.property.title}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1A3C5E" />
        </View>
      ) : (
        <FlatList
          data={inquiry?.messages ?? []}
          keyExtractor={(_, i) => String(i)}
          contentContainerClassName="px-4 py-4 gap-3"
          inverted={false}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View
                className={[
                  "flex-row",
                  isMine ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                <View
                  className={[
                    "max-w-[80%] px-4 py-3 rounded-2xl",
                    isMine
                      ? "bg-[#1A3C5E] rounded-tr-sm"
                      : "bg-white border border-[#E2E8F0] rounded-tl-sm",
                  ].join(" ")}
                >
                  <Text
                    className={[
                      "text-sm",
                      isMine ? "text-white" : "text-[#374151]",
                    ].join(" ")}
                    style={{ fontFamily: "DMSans_400Regular" }}
                  >
                    {item.message}
                  </Text>
                  <Text
                    className={[
                      "text-xs mt-1",
                      isMine ? "text-[#A9C3DD]" : "text-[#94A3B8]",
                    ].join(" ")}
                  >
                    {formatDate(item.sentAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-row items-end px-4 py-3 bg-white border-t border-[#E2E8F0] gap-3">
          <TextInput
            className="flex-1 min-h-[44px] max-h-28 px-4 py-3 bg-[#F1F5F9] rounded-2xl text-sm text-[#1E293B]"
            placeholder="Type a message…"
            placeholderTextColor="#94A3B8"
            value={message}
            onChangeText={setMessage}
            multiline
            style={{ fontFamily: "DMSans_400Regular" }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="w-11 h-11 bg-[#1A3C5E] rounded-full items-center justify-center"
            activeOpacity={0.85}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Feather name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
