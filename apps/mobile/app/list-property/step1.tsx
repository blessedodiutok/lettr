// File: apps/mobile/app/list-property/step1.tsx
// Step 1: Property type + address
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
];

const STATES = ["Lagos", "Abuja (FCT)", "Rivers", "Kano", "Oyo", "Delta"];

export default function ListPropertyStep1Screen() {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [lga, setLga] = useState("");
  const [state, setState] = useState("");

  const canContinue = propertyType && address && neighbourhood && lga && state;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["bottom"]}>
      <ScrollView contentContainerClassName="px-4 py-6 gap-6">
        {/* Progress */}
        <View className="flex-row gap-1">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <View
              key={s}
              className={[
                "flex-1 h-1.5 rounded-full",
                s === 1 ? "bg-[#1A3C5E]" : "bg-[#E2E8F0]",
              ].join(" ")}
            />
          ))}
        </View>

        <Text
          className="text-xl text-[#1A3C5E]"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          What type of property?
        </Text>

        {/* Property type grid */}
        <View className="flex-row flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setPropertyType(t.value)}
              className={[
                "px-4 py-2.5 rounded-xl border-2",
                propertyType === t.value
                  ? "border-[#1A3C5E] bg-[#EEF3F8]"
                  : "border-[#E2E8F0] bg-white",
              ].join(" ")}
            >
              <Text
                className={
                  propertyType === t.value
                    ? "text-[#1A3C5E] font-bold text-sm"
                    : "text-[#64748B] text-sm"
                }
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          className="text-xl text-[#1A3C5E]"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          Where is it located?
        </Text>

        {[
          {
            label: "Full address",
            value: address,
            setter: setAddress,
            placeholder: "15 Admiralty Way, Lekki Phase 1",
          },
          {
            label: "Neighbourhood",
            value: neighbourhood,
            setter: setNeighbourhood,
            placeholder: "Lekki Phase 1",
          },
          { label: "LGA", value: lga, setter: setLga, placeholder: "Eti-Osa" },
        ].map((field) => (
          <View key={field.label}>
            <Text
              className="text-sm font-semibold text-[#374151] mb-1.5"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {field.label}
            </Text>
            <TextInput
              className="h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B]"
              placeholder={field.placeholder}
              value={field.value}
              onChangeText={field.setter}
              placeholderTextColor="#94A3B8"
            />
          </View>
        ))}

        {/* State */}
        <View>
          <Text
            className="text-sm font-semibold text-[#374151] mb-2"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            State
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STATES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setState(s)}
                className={[
                  "px-4 py-2 rounded-xl border-2",
                  state === s
                    ? "border-[#1A3C5E] bg-[#EEF3F8]"
                    : "border-[#E2E8F0] bg-white",
                ].join(" ")}
              >
                <Text
                  className={
                    state === s
                      ? "text-[#1A3C5E] font-bold text-sm"
                      : "text-[#64748B] text-sm"
                  }
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="px-4 py-4 bg-white border-t border-[#E2E8F0]">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/list-property/step2" as never,
              params: { propertyType, address, neighbourhood, lga, state },
            })
          }
          disabled={!canContinue}
          className={[
            "h-14 rounded-xl items-center justify-center",
            canContinue ? "bg-[#1A3C5E]" : "bg-[#CBD5E1]",
          ].join(" ")}
          activeOpacity={0.85}
        >
          <Text
            className="text-white font-bold text-base"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
