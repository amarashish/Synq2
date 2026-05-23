import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import Skeleton from "./Skeleton";

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

export default function EventPlanCard({
  plan,
  onCommit,
  onCheckIn,
  onViewAttendees,
  isDark,
  isCheckingIn,
}) {
  const theme = Colors[isDark ? "dark" : "light"];
  const isPast = plan.type === "past";

  const startDate = new Date(plan.start_time || plan.time);
  const endDate = new Date(plan.end_time || plan.endTime);
  const month = startDate
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = startDate.getDate();
  const startTime = startDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = endDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const location = plan.location_name || plan.location || "TBD";
  const goingCount = plan.participants || plan.goingCount || 0;
  const karma = plan.karma_cost || plan.karma || 0;
  const tribeName = plan.tribe_name;
  const category = (tribeName || "").toLowerCase();
  const matchedKey = Object.keys(categoryIcons).find((k) =>
    category.includes(k),
  );
  const icon = matchedKey ? categoryIcons[matchedKey] : "calendar";

  return (
    <View
      className="mb-4 overflow-hidden"
      style={{
        borderRadius: 16,
        backgroundColor: theme.cardBg,
        borderWidth: 1.5,
        borderColor: theme.brand,
        ...Platform.select({
          ios: {
            shadowColor: isPast ? theme.shadowSm : theme.shadow,
            shadowOffset: { width: 0, height: isPast ? 2 : 4 },
            shadowOpacity: 1,
            shadowRadius: isPast ? 6 : 12,
          },
          android: { elevation: isPast ? 3 : 6 },
        }),
      }}
    >
      <View className="p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{
                backgroundColor: isPast ? theme.textMuted : theme.brand,
                zIndex: 2,
              }}
            >
              <Ionicons name={icon} size={13} color="#FFF" />
            </View>
            <View
              className="px-3 py-1 rounded-full -ml-3.5 border"
              style={{
                backgroundColor: theme.surface,
                borderColor: isPast ? theme.textMuted : theme.brand,
                borderWidth: 1,
              }}
            >
              <Text
                className="text-[9px] font-black uppercase tracking-wider ml-1"
                style={{ color: isPast ? theme.textMuted : theme.brand }}
              >
                {tribeName || "Event"}
              </Text>
            </View>
          </View>
          <Text
            className="text-[9px] uppercase tracking-[1px] mr-1"
            style={{ fontFamily: "Inter-SemiBold", color: theme.textMuted }}
          >
            {goingCount} going
          </Text>
        </View>

        <View className="flex-row justify-between items-start mt-3">
          <View className="flex-1 mr-4">
            <Text
              className="text-xl uppercase tracking-tight mb-1.5 font-caveatbrush"
              style={{ color: isPast ? theme.textMuted : theme.text }}
              numberOfLines={1}
            >
              {plan.title}
            </Text>
            <View className="flex-row items-center mb-1">
              <Ionicons
                name="time-outline"
                size={11}
                color={theme.accentGold}
              />
              <Text
                className="text-[10px] ml-1.5"
                style={{ fontFamily: "Inter-SemiBold", color: theme.textMuted }}
              >
                {startTime} - {endTime}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons
                name="location-outline"
                size={11}
                color={theme.accentGold}
              />
              <Text
                className="text-[10px] ml-1.5"
                style={{ fontFamily: "Inter-SemiBold", color: theme.textMuted }}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          </View>
          <View
            className="w-14 h-14 rounded-xl items-center justify-center"
            style={{
              backgroundColor: theme.surface,
              borderWidth: 2,
              borderColor: theme.borderLight,
            }}
          >
            <Text
              className="text-[8px] font-caveatbrush uppercase tracking-wider"
              style={{ color: theme.textMuted }}
            >
              {month}
            </Text>
            <Text
              className="text-3xl font-caveatbrush mt-0.5"
              style={{ color: isPast ? theme.textMuted : theme.text }}
            >
              {day}
            </Text>
          </View>
        </View>

        <View
          className="my-3"
          style={{ height: 1, backgroundColor: theme.borderLight }}
        />

        <View className="flex-row items-center justify-between">
          {isPast ? (
            <TouchableOpacity
              onPress={() => onViewAttendees?.(plan)}
              className="py-2.5 px-5 rounded-full"
              style={{ backgroundColor: theme.brandLight }}
            >
              <Text
                className="text-[9px] font-black uppercase tracking-[1px]"
                style={{ color: theme.brand }}
              >
                View Attendees
              </Text>
            </TouchableOpacity>
          ) : plan.committed ? (
            <View
              className="py-2.5 px-5 rounded-full"
              style={{ backgroundColor: theme.semanticLight }}
            >
              <Text
                className="text-[9px] font-black uppercase tracking-[1px]"
                style={{ color: theme.semantic }}
              >
                Committed
              </Text>
            </View>
          ) : onCommit ? (
            <TouchableOpacity
              onPress={() => onCommit(plan.id, karma)}
              className="py-2.5 px-5 rounded-full"
              style={{ backgroundColor: theme.brand }}
            >
              <Text
                className="text-[9px] font-black uppercase tracking-[1px] text-white"
                style={{ color: "#FFF" }}
              >
                Commit {karma} Karma
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onCheckIn?.(plan)}
              disabled={isCheckingIn}
              className="py-2.5 px-5 rounded-full"
              style={{ backgroundColor: theme.brand }}
            >
              <Text
                className="text-[9px] font-black uppercase tracking-[1px] text-white"
                style={{ color: "#FFF" }}
              >
                {isCheckingIn ? "..." : "Check In"}
              </Text>
            </TouchableOpacity>
          )}
          {!isPast && (
            <Text
              className="text-[9px] uppercase tracking-[1px]"
              style={{ fontFamily: "Inter-SemiBold", color: theme.textMuted }}
            >
              {karma} Karma
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
