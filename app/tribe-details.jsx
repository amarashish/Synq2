import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import {
  fetchTribeDetails,
  fetchTribeMembers,
  clearTribeDetails,
} from "../store/tribeSlice";
import { fetchDailySparkForTribe } from "../store/sparkSlice";

export default function TribeDetailsScreen() {
  const { tribeId, tribeName: initialName } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();

  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const userId = useSelector((state) => state.auth.user?.id);
  const tribeDetails = useSelector((state) => state.tribe.tribeDetails);
  const tribeMembers = useSelector((state) => state.tribe.tribeMembers) || [];
  const detailsStatus = useSelector((state) => state.tribe.detailsStatus);
  const membersStatus = useSelector((state) => state.tribe.membersStatus);
  const dailySparks =
    useSelector((state) => state.spark.dailySparkByTribe) || {};

  const sparkData = dailySparks[tribeId];
  const hasSparkToday = !!sparkData?.id;
  const isUnlocked = hasSparkToday && sparkData?.answered_by?.includes(userId);

  useEffect(() => {
    dispatch(clearTribeDetails());
    if (tribeId) {
      dispatch(fetchTribeDetails(tribeId));
      dispatch(fetchTribeMembers(tribeId));
      dispatch(fetchDailySparkForTribe(tribeId));
    }
    return () => {
      dispatch(clearTribeDetails());
    };
  }, [tribeId]);

  const handleEnterChat = () => {
    router.replace({
      pathname: "/tribe-chat",
      params: {
        tribeId,
        tribeName: tribeDetails?.name || initialName,
        isUnlocked: isUnlocked ? "true" : "false",
      },
    });
  };

  const handleBack = () => {
    router.replace("/tribes");
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const loading = detailsStatus === "loading" || membersStatus === "loading";

  return (
    <View
      style={{ flex: 1, paddingTop: insets.top, backgroundColor: theme.bg }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2 rounded-xl"
          style={{ backgroundColor: theme.surface }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text
          className="text-lg uppercase tracking-tighter font-heading"
          style={{ color: theme.text }}
          numberOfLines={1}
        >
          {tribeDetails?.name || initialName || "Tribe"}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-32">
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <>
            <View className="px-6 pt-4 pb-6">
              <View
                className="p-6 items-center overflow-hidden"
                style={{
                  borderRadius: theme.cardRadius,
                  backgroundColor: theme.bg,
                  borderWidth: 1,
                  borderColor: theme.borderLight,
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
                <View className="pt-4 items-center">
                  <View
                    className="w-28 h-28 rounded-2xl items-center justify-center mb-4"
                    style={{ backgroundColor: theme.brandLight }}
                  >
                    <Ionicons name="people" size={52} color={theme.brand} />
                  </View>
                  <Text
                    className="text-2xl uppercase tracking-tighter text-center font-heading"
                    style={{ color: theme.text }}
                  >
                    {tribeDetails?.name || initialName}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Text
                      className="text-sm"
                      style={{
                        fontFamily: "Inter-Medium",
                        color: theme.textMuted,
                      }}
                    >
                      {tribeDetails?.category || "General"}
                    </Text>
                    {tribeDetails?.city && (
                      <>
                        <Ionicons
                          name="location"
                          size={12}
                          color={theme.accentGold}
                          style={{ marginHorizontal: 4 }}
                        />
                        <Text
                          className="text-sm"
                          style={{
                            fontFamily: "Inter-Medium",
                            color: theme.textMuted,
                          }}
                        >
                          {tribeDetails.city}
                        </Text>
                      </>
                    )}
                  </View>
                  {tribeDetails?.description && (
                    <Text
                      className="text-sm mt-4 text-center px-2"
                      style={{
                        fontFamily: "Inter-Medium",
                        color: theme.textMuted,
                      }}
                    >
                      " + "{tribeDetails.description}"
                    </Text>
                  )}
                  <View className="flex-row mt-6 gap-3">
                    <View
                      className="flex-1 items-center py-3 px-2 rounded-xl"
                      style={{
                        backgroundColor: theme.surface,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                      }}
                    >
                      <Text
                        className="text-2xl font-heading"
                        style={{
                          color: theme.brand,
                        }}
                      >
                        {tribeDetails?.memberCount || 0}
                      </Text>
                      <Text
                        className="text-[10px] uppercase tracking-wider mt-1"
                        style={{
                          fontFamily: "Inter-Bold",
                          color: theme.textMuted,
                        }}
                      >
                        Members
                      </Text>
                    </View>
                    <View
                      className="flex-1 items-center py-3 px-2 rounded-xl"
                      style={{
                        backgroundColor: theme.surface,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                      }}
                    >
                      <Text
                        className="text-2xl font-heading"
                        style={{
                          color: theme.brand,
                        }}
                      >
                        {tribeDetails?.eventCount || 0}
                      </Text>
                      <Text
                        className="text-[10px] uppercase tracking-wider mt-1"
                        style={{
                          fontFamily: "Inter-Bold",
                          color: theme.textMuted,
                        }}
                      >
                        Events
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="mt-6">
                {isUnlocked ? (
                  <TouchableOpacity
                    onPress={handleEnterChat}
                    className="py-4 rounded-xl items-center flex-row justify-center"
                    style={{ backgroundColor: theme.brand }}
                  >
                    <Ionicons name="chatbubbles" size={22} color="white" />
                    <Text
                      className="text-white text-base uppercase tracking-wider ml-2 font-heading"
                    >
                      Enter Chat
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    className="py-4 rounded-xl items-center flex-row justify-center"
                    style={{
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.borderLight,
                    }}
                  >
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color={theme.textMuted}
                    />
                    <Text
                      className="text-base uppercase tracking-wider ml-2 font-heading"
                      style={{
                        color: theme.textMuted,
                      }}
                    >
                      Locked
                    </Text>
                  </View>
                )}
                {!isUnlocked && (
                  <Text
                    className="text-center text-xs mt-2"
                    style={{
                      fontFamily: "Inter-Medium",
                      color: theme.textMuted,
                    }}
                  >
                    Answer today's spark to unlock the chat
                  </Text>
                )}
              </View>
            </View>

            <View className="px-6 mt-2">
              <View className="flex-row items-center mb-4">
                <Ionicons name="people-outline" size={20} color={theme.brand} />
                <Text
                  className="text-base uppercase tracking-tighter ml-2 font-heading"
                  style={{ color: theme.text }}
                >
                  Members ({tribeMembers.length})
                </Text>
              </View>
              {tribeMembers.length > 0 ? (
                <View className="gap-3 pb-20">
                  {tribeMembers.slice(0, 10).map((member) => {
                    const name =
                      member.profile?.full_name ||
                      member.profile?.username ||
                      "Unknown";
                    const initials = getInitials(name);
                    return (
                      <View
                        key={member.user_id}
                        className="p-4 rounded-xl flex-row items-center"
                        style={{
                          backgroundColor: theme.bg,
                          borderWidth: 1,
                          borderColor: theme.borderLight,
                        }}
                      >
                        <View
                          className="w-12 h-12 rounded-xl items-center justify-center"
                          style={{ backgroundColor: theme.brandLight }}
                        >
                          <Text
                            className="text-sm"
                            style={{
                              fontFamily: "Inter-Bold",
                              color: theme.brand,
                            }}
                          >
                            {initials}
                          </Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <Text
                            className="text-sm"
                            style={{
                              fontFamily: "Inter-SemiBold",
                              color: theme.text,
                            }}
                          >
                            {name}
                          </Text>
                          {member.profile?.karma_points > 0 && (
                            <Text
                              className="text-[11px] mt-0.5"
                              style={{
                                fontFamily: "Inter-Medium",
                                color: theme.textMuted,
                              }}
                            >
                              {member.profile.karma_points} karma
                            </Text>
                          )}
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={theme.textMuted}
                        />
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View
                  className="py-12 rounded-xl items-center"
                  style={{
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                  }}
                >
                  <Ionicons
                    name="people-outline"
                    size={40}
                    color={theme.textMuted}
                  />
                  <Text
                    className="mt-2"
                    style={{
                      fontFamily: "Inter-Medium",
                      color: theme.textMuted,
                    }}
                  >
                    No members yet
                  </Text>
                </View>
              )}
              {tribeMembers.length > 10 && (
                <TouchableOpacity className="py-4 items-center">
                  <Text
                    className="text-sm uppercase tracking-wider"
                    style={{ fontFamily: "Inter-Bold", color: theme.brand }}
                  >
                    View all {tribeMembers.length} members
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
