import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

export default function EventCard({
  event,
  tribeName,
  isCommitted,
  isAttended,
  isNear,
  isCheckingIn,
  onCheckIn,
  onViewAttendees,
  isDark,
  type = "ongoing",
  onAcceptInvite,
  inviteStatus,
  attendeeCount,
  isLive,
}) {
  const theme = Colors[isDark ? "dark" : "light"];

  if (type === "friend-invite") {
    const eventDate = new Date(event.start_time);
    const eventEndDate = new Date(event.end_time);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const formattedEndTime = eventEndDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const goingCount = attendeeCount || 0;

    return (
      <View
        className="mb-4 overflow-hidden"
        style={{
          borderRadius: theme.cardRadius,
          backgroundColor: theme.cardBg,
          ...Platform.select({
            ios: {
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 12,
            },
            android: { elevation: 6 },
          }),
        }}
      >
        <View style={{ height: 4, backgroundColor: theme.brand }} />
        <View className="p-5">
          <View className="flex-row items-start mb-3">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: theme.brandLight }}
            >
              <Ionicons name="calendar" size={18} color={theme.brand} />
            </View>
            <View className="ml-3 flex-1">
              <Text
                className="text-base uppercase tracking-tight"
                style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
              >
                {event.title}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color={theme.textMuted}
                />
                <Text
                  className="text-[11px] ml-1"
                  style={{
                    fontFamily: "Inter-SemiBold",
                    color: theme.textMuted,
                  }}
                >
                  {formattedDate} {formattedTime} - {formattedEndTime}
                </Text>
              </View>
              <View className="flex-row items-center mt-0.5">
                <Ionicons
                  name="location-outline"
                  size={11}
                  color={theme.textMuted}
                />
                <Text
                  className="text-[11px] ml-1"
                  style={{
                    fontFamily: "Inter-SemiBold",
                    color: theme.textMuted,
                  }}
                >
                  {event.location_name}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              {goingCount > 0 && (
                <>
                  <View className="flex-row items-center">
                    {Array(Math.min(goingCount, 3))
                      .fill(null)
                      .map((_, i) => {
                        const colors = [
                          theme.brand,
                          theme.accentGold,
                          theme.semantic,
                        ];
                        return (
                          <View
                            key={i}
                            className="w-6 h-6 rounded-full items-center justify-center border-2"
                            style={{
                              backgroundColor: colors[i % 3],
                              borderColor: theme.bg,
                              marginLeft: i === 0 ? 0 : -8,
                            }}
                          >
                            <Text
                              className="text-[8px] text-white"
                              style={{ fontFamily: "Inter-Black" }}
                            >
                              {goingCount > 3 && i === 2
                                ? `+${goingCount - 2}`
                                : ""}
                            </Text>
                          </View>
                        );
                      })}
                  </View>
                  <Text
                    className="text-[10px] uppercase ml-1 tracking-[1px]"
                    style={{
                      fontFamily: "Inter-SemiBold",
                      color: theme.textMuted,
                    }}
                  >
                    {goingCount} going
                  </Text>
                </>
              )}
            </View>
            {inviteStatus === "invited" ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onAcceptInvite?.(event.id);
                }}
                className="px-5 py-2.5 rounded-xl"
                style={{ backgroundColor: theme.brand }}
              >
                <Text
                  className="text-white text-[10px] uppercase tracking-wider font-heading"
                >
                  Accept
                </Text>
              </TouchableOpacity>
            ) : inviteStatus === "committed" ? (
              isLive ? (
                <View
                  className="px-3 py-1.5 rounded-full border flex-row items-center"
                  style={{
                    backgroundColor: theme.semanticLight,
                    borderColor: theme.semantic,
                  }}
                >
                  <View
                    className="w-1.5 h-1.5 rounded-full mr-1.5"
                    style={{ backgroundColor: theme.semantic }}
                  />
                  <Text
                    className="text-[10px] uppercase tracking-[1px] font-heading"
                    style={{
                      color: theme.semantic,
                    }}
                  >
                    LIVE
                  </Text>
                </View>
              ) : (
                <View
                  className="px-3 py-1.5 rounded-full border"
                  style={{
                    backgroundColor: theme.semanticLight,
                    borderColor: theme.semantic,
                  }}
                >
                  <Text
                    className="text-[10px] uppercase tracking-[1px] font-heading"
                    style={{
                      color: theme.semantic,
                    }}
                  >
                    Committed
                  </Text>
                </View>
              )
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  if (type === "ongoing") {
    const startTime = new Date(event.start_time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <TouchableOpacity
        onPress={() => {}}
        activeOpacity={0.7}
        className="mb-3 overflow-hidden"
        style={{
          borderRadius: theme.elementRadius,
          backgroundColor: theme.cardBg,
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
        <View className="p-4">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: theme.brandLight }}
            >
              <Ionicons name="calendar" size={18} color={theme.brand} />
            </View>
            <View className="flex-1 ml-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  {tribeName && (
                    <Text
                      className="text-[11px] uppercase tracking-wide"
                      style={{
                        fontFamily: "Inter-SemiBold",
                        color: theme.brand,
                      }}
                    >
                      {tribeName}
                    </Text>
                  )}
                  <Text
                    numberOfLines={1}
                    className="text-base"
                    style={{ fontFamily: "Inter-Bold", color: theme.text }}
                  >
                    {event.title}
                  </Text>
                </View>
                {isAttended ? (
                  <View
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: theme.semanticLight }}
                  >
                    <Text
                      className="text-[10px] uppercase tracking-wider"
                      style={{
                        fontFamily: "Inter-Bold",
                        color: theme.semantic,
                      }}
                    >
                      Attended
                    </Text>
                  </View>
                ) : isCommitted ? (
                  isNear ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onCheckIn(event.id);
                      }}
                      disabled={isCheckingIn}
                      className="px-4 py-2 rounded-xl"
                      style={{ backgroundColor: theme.brand }}
                    >
                      <Text
                        className="text-white text-[10px] uppercase tracking-wider"
                        style={{ fontFamily: "Inter-Bold" }}
                      >
                        {isCheckingIn ? "..." : "Check In"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: theme.surface }}
                    >
                      <Text
                        className="text-[10px]"
                        style={{
                          fontFamily: "Inter-SemiBold",
                          color: theme.textMuted,
                        }}
                      >
                        Nearby
                      </Text>
                    </View>
                  )
                ) : (
                  <View
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: theme.brandLight }}
                  >
                    <Text
                      className="text-[10px] uppercase tracking-wider"
                      style={{ fontFamily: "Inter-Bold", color: theme.brand }}
                    >
                      Live
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center mt-2">
                <Ionicons
                  name="time-outline"
                  size={11}
                  color={theme.accentGold}
                />
                <Text
                  className="text-[11px] ml-1"
                  style={{
                    fontFamily: "Inter-SemiBold",
                    color: theme.textMuted,
                  }}
                >
                  {startTime}
                </Text>
                <Ionicons
                  name="location-outline"
                  size={11}
                  color={theme.accentGold}
                  className="ml-3"
                />
                <Text
                  numberOfLines={1}
                  className="text-[11px] ml-1"
                  style={{
                    fontFamily: "Inter-SemiBold",
                    color: theme.textMuted,
                  }}
                >
                  {event.location_name || "TBD"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const endTime = new Date(event.end_time);
  const dateStr = endTime.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View
      className="mb-3 overflow-hidden"
      style={{
        borderRadius: theme.elementRadius,
        backgroundColor: theme.cardBg,
        ...Platform.select({
          ios: {
            shadowColor: theme.shadowSm,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 6,
          },
          android: { elevation: 3 },
        }),
      }}
    >
      <View className="p-4">
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: theme.accentSlate + "25" }}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={theme.textMuted}
            />
          </View>
          <View className="flex-1 ml-3">
            {tribeName && (
              <Text
                className="text-[11px] uppercase tracking-wide"
                style={{ fontFamily: "Inter-SemiBold", color: theme.brand }}
              >
                {tribeName}
              </Text>
            )}
            <Text
              numberOfLines={1}
              className="text-base"
              style={{ fontFamily: "Inter-Bold", color: theme.text }}
            >
              {event.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons
                name="calendar-outline"
                size={11}
                color={theme.textMuted}
              />
              <Text
                className="text-[11px] ml-1"
                style={{ fontFamily: "Inter-SemiBold", color: theme.textMuted }}
              >
                {dateStr}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onViewAttendees(event);
                }}
                className="ml-auto px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: theme.brandLight }}
              >
                <Text
                  className="text-[10px] uppercase tracking-wider"
                  style={{ fontFamily: "Inter-Bold", color: theme.brand }}
                >
                  View
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
