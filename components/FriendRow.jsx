import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

export default function FriendRow({ friend, isDark, onPress, onLongPress }) {
  const theme = Colors[isDark ? "dark" : "light"];
  const initials = (friend.full_name || friend.username || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      className="flex-row items-center py-3.5"
      style={{ borderBottomWidth: 1, borderBottomColor: theme.borderLight }}
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center"
        style={{ backgroundColor: theme.brandLight }}
      >
        <Text
          className="text-sm text-white"
          style={{ fontFamily: "Inter-Bold", color: theme.brand }}
        >
          {initials}
        </Text>
      </View>
      <View className="flex-1 ml-3">
        <Text
          className="text-sm"
          style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
        >
          {friend.full_name || friend.username || "Unknown"}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: theme.accentGoldLight }}
          >
            <Text
              className="text-[8px] uppercase tracking-wider"
              style={{ fontFamily: "Inter-Bold", color: theme.accentGold }}
            >
              Friend
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}
