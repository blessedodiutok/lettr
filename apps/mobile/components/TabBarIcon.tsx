// File: apps/mobile/components/TabBarIcon.tsx
import { Feather } from "@expo/vector-icons";

type FeatherName = keyof typeof Feather.glyphMap;

interface TabBarIconProps {
  name: FeatherName;
  color: string;
  focused: boolean;
}

export function TabBarIcon({ name, color }: TabBarIconProps) {
  return <Feather name={name} size={22} color={color} />;
}
