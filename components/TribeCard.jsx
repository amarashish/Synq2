import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

const categoryIcons = {
  music: "musical-notes",
  fitness: "barbell",
  art: "brush",
  gaming: "game-controller",
  tech: "code-slash",
  food: "restaurant",
  travel: "airplane",
  social: "people",
  business: "briefcase",
  wellness: "leaf",
};

export default function TribeCard({
  tribe,
  isJoined,
  onJoin,
  onPress,
  memberCount,
  isDark,
}) {
  const theme = Colors[isDark ? "dark" : "light"];
  const category = (tribe.category || tribe.name || "").toLowerCase();
  const matchedKey = Object.keys(categoryIcons).find((k) =>
    category.includes(k),
  );
  const icon = matchedKey ? categoryIcons[matchedKey] : "people";
  const description = tribe.description || "No description yet";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-3 overflow-hidden"
      style={{
        borderRadius: theme.elementRadius,
        backgroundColor: theme.bg,
        ...Platform.select({
          ios: {
            shadowColor: theme.shadowSm,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
          },
          android: { elevation: 4 },
        }),
      }}
    >
      <View style={{ height: 4, backgroundColor: theme.brand }} />
      <View className="p-4">
        <View className="flex-row items-start">
          <View
            className="w-11 h-11 rounded-xl items-center justify-center"
            style={{ backgroundColor: theme.brandLight }}
          >
            <Ionicons name={icon} size={20} color={theme.brand} />
          </View>
          <View className="flex-1 ml-3">
            <Text
              className="text-sm uppercase tracking-tight"
              style={{ fontFamily: "Inter-Bold", color: theme.text }}
            >
              {tribe.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons
                name="people-outline"
                size={11}
                color={theme.textMuted}
              />
              <Text
                className="text-[10px] uppercase ml-1 tracking-wide"
                style={{ fontFamily: "Inter-SemiBold", color: theme.textMuted }}
              >
                {memberCount != null ? `${memberCount} members` : ""}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onJoin(tribe);
            }}
            disabled={isJoined}
            className="px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: isJoined ? theme.surface : theme.brand }}
          >
            <Text
              className="text-[10px] uppercase tracking-wider font-heading"
              style={{
                color: isJoined ? theme.textMuted : "#FFF",
              }}
            >
              {isJoined ? "Joined" : "Join"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text
          numberOfLines={2}
          className="text-[12px] mt-3 leading-relaxed"
          style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
        >
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
