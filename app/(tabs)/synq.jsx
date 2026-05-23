import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors } from "../../constants/Colors";
import GradientBackground from "../../components/GradientBackground";
import {
  fetchEvents,
  fetchLiveStories,
  fetchLiveEvents,
  fetchPastEvents,
  fetchUserRsvps,
  fetchEventRsvps,
  fetchParticipantProfiles,
  commitEvent,
  attendEventWithLocation,
  clearAllEventState,
} from "../../store/eventSlice";
import { fetchJoinedTribes, clearTribeState } from "../../store/tribeSlice";
import { updateStreak } from "../../store/authSlice";
import {
  submitSparkAnswer,
  fetchAllSparksForJoinedTribes,
  fetchDailySparkForTribe,
  clearSparkState,
} from "../../store/sparkSlice";
import { sendMessage } from "../../lib/api";
import SparkCarousel from "../../components/SparkCarousel";
import EventPlanCard from "../../components/EventPlanCard";
import Skeleton from "../../components/Skeleton";

const { width: windowWidth } = Dimensions.get("window");

export default function SynqScreen() {
  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const dispatch = useDispatch();
  const router = useRouter();

  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const userId = useSelector((state) => state.auth.user?.id);
  const user = useSelector((state) => state.auth.user);
  const karmaPoints = useSelector((state) => state.auth.karmaPoints);
  const streakCount = useSelector((state) => state.auth.streakCount);
  const joinedTribes = useSelector((state) => state.tribe.joinedTribes);
  const dailySparks =
    useSelector((state) => state.spark.dailySparkByTribe) || {};
  const sparkStatus = useSelector((state) => state.spark.status) || "idle";
  const events = useSelector((state) => state.event.events);
  const liveStories = useSelector((state) => state.event.liveStories) || [];
  const liveEvents = useSelector((state) => state.event.liveEvents) || [];
  const pastEvents = useSelector((state) => state.event.pastEvents) || [];
  const committedEvents =
    useSelector((state) => state.event.committedEvents) || [];
  const eventStatus = useSelector((state) => state.event.status);
  const eventsLoaded = useSelector((state) => state.event.eventsLoaded);
  const eventRsvps = useSelector((state) => state.event.eventRsvps) || {};
  const eventParticipants =
    useSelector((state) => state.event.eventParticipants) || {};

  useEffect(() => {
    console.log("User", user);
  }, [user]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [answer, setAnswer] = useState("");
  const [activeSparkTribeId, setActiveSparkTribeId] = useState(null);
  const [activeSparkInfo, setActiveSparkInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      dispatch(fetchJoinedTribes(userId));
      dispatch(fetchEvents());
      dispatch(fetchLiveStories());
      dispatch(fetchLiveEvents());
      dispatch(fetchPastEvents());
      dispatch(fetchUserRsvps(userId));
    }, [dispatch, userId]),
  );

  useEffect(() => {
    return () => {
      dispatch(clearAllEventState());
      dispatch(clearTribeState());
      dispatch(clearSparkState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (events && events.length > 0) {
      const upcomingEventIds = events
        .filter((e) => {
          const eventStart = new Date(e.start_time);
          return eventStart > new Date();
        })
        .map((e) => e.id);
      if (upcomingEventIds.length > 0) {
        dispatch(fetchEventRsvps(upcomingEventIds));
      }
    }
  }, [events, dispatch]);

  useEffect(() => {
    if (eventRsvps && Object.keys(eventRsvps).length > 0) {
      const allUserIds = [...new Set(Object.values(eventRsvps).flat())];
      if (allUserIds.length > 0) {
        dispatch(fetchParticipantProfiles(allUserIds));
      }
    }
  }, [eventRsvps, dispatch]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log("[SYNQ] Error getting location:", error);
      }
    })();
  }, []);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isNearEvent = (eventLat, eventLng) => {
    if (!userLocation || !eventLat || !eventLng) return false;
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      eventLat,
      eventLng,
    );
    return distance <= 200;
  };

  const displayStories = [
    ...liveEvents
      .filter((e) => e.event_type !== "FRIEND_EVENT")
      .map((event) => ({
        id: `live-${event.id}`,
        type: "LIVE_EVENT",
        tribe:
          joinedTribes?.find((t) => t.id === event.tribe_id)?.name || "Event",
        eventId: event.id,
        eventTitle: event.title,
        location: event.location_name,
      })),
    ...(liveStories || []),
  ];

  const availableSparks = useMemo(() => {
    if (!joinedTribes || joinedTribes.length === 0) return [];
    return joinedTribes.map((tribe) => {
      const currentSparksMap = dailySparks || {};
      const sparkData = currentSparksMap[tribe.id];
      return {
        id: tribe.id,
        tribe: tribe.name,
        question: sparkData?.question || "Loading today's spark...",
        sparkId: sparkData?.id,
      };
    });
  }, [joinedTribes, dailySparks]);

  const answeredTribeSparks = joinedTribes
    ? joinedTribes
        .filter((tribe) => {
          const spark = dailySparks[tribe.id];
          if (spark?.answered_by?.includes(userId)) return true;
          return false;
        })
        .map((tribe) => tribe.name)
    : [];

  const now = new Date();
  const upcomingPlans = events
    ? events
        .filter((event) => {
          const eventStart = new Date(event.start_time);
          const eventEnd = new Date(event.end_time);
          return eventStart > now && event.event_type !== "FRIEND_EVENT";
        })
        .map((event) => {
          const eventRsvpUserIds = eventRsvps[event.id] || [];
          return {
            ...event,
            id: event.id,
            title: event.title,
            location: event.location_name || "TBD",
            participants: eventRsvpUserIds.length,
            participantUserIds: eventRsvpUserIds,
            karma: event.karma_cost || 0,
            tribe_name: event.tribe_id
              ? joinedTribes?.find((t) => t.id === event.tribe_id)?.name
              : null,
            committed: committedEvents.includes(event.id),
          };
        })
    : [];

  useEffect(() => {
    if (joinedTribes && joinedTribes.length > 0) {
      dispatch(fetchAllSparksForJoinedTribes(joinedTribes));
      if (!activeSparkTribeId && joinedTribes.length > 0) {
        setActiveSparkTribeId(joinedTribes[0].id);
      }
    }
  }, [dispatch, joinedTribes]);

  const handleStoryPress = (story) => {
    Alert.alert("Story", `Viewing ${story.tribe} ${story.type} story`);
  };

  const handleCommitPlan = async (eventId, karma) => {
    if (!userId) return;
    try {
      await dispatch(
        commitEvent({ userId, eventId, karmaCost: karma }),
      ).unwrap();
      await dispatch(fetchUserRsvps(userId));
      Alert.alert("Committed!", `You've spent ${karma} Karma!`);
    } catch (error) {
      Alert.alert("Error", error || "Failed to commit.");
    }
  };

  const handleIAmIn = async (eventId) => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }
    setIsCheckingIn(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to check in.",
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await dispatch(attendEventWithLocation({ userId, eventId })).unwrap();
      Alert.alert(
        "Check-in Successful!",
        "Location verified. You earned 10 Karma points!",
      );
    } catch (err) {
      if (err && err.includes("too far")) {
        Alert.alert(
          "Location Error",
          "You're not close enough to this event location.",
        );
      } else {
        Alert.alert("Error", err || "Failed to check in.");
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / windowWidth);
    setCurrentIndex(index);
    if (availableSparks && availableSparks[index]) {
      setActiveSparkTribeId(availableSparks[index].id);
    }
  };

  const handleSubmitAnswer = async () => {
    if (isSubmitting) return;

    const currentSpark = dailySparks[activeSparkTribeId];
    const sparkId = currentSpark?.id;

    if (!answer.trim() || !sparkId || !activeSparkTribeId) {
      Alert.alert("Error", "Sawal load nahi hua hai. Ek baar refresh karo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch(
        submitSparkAnswer({ userId, sparkId: sparkId, answerText: answer }),
      ).unwrap();
      if (result?.streak_count !== undefined) {
        dispatch(updateStreak(result.streak_count));
      }
      const tribeName = activeSparkInfo?.tribe || "TRIBE";
      await sendMessage({
        tribeId: activeSparkTribeId,
        tribeName,
        receiverId: null,
        userId,
        content: `${answer}`,
        userName: user.username,
      });
      await dispatch(fetchJoinedTribes(userId)).unwrap();
      if (activeSparkTribeId) {
        await dispatch(fetchDailySparkForTribe(activeSparkTribeId)).unwrap();
      }
      setModalVisible(false);
      setAnswer("");
      setActiveSparkInfo(null);
      router.push({
        pathname: "/tribe-chat",
        params: {
          tribeId: activeSparkTribeId,
          tribeName,
          hasAnsweredToday: "true",
        },
      });
    } catch (error) {
      console.error("[SUBMIT ERROR]:", error);
      Alert.alert("Error", "Answer submit nahi ho paya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground isDark={isDark} style={{ paddingTop: 64 }}>
      <View className="px-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text
            className="text-3xl tracking-tighter font-heading"
            style={{ color: theme.brand }}
          >
           SYNQ
          </Text>
          <View className="flex-row items-center">
            <View className="flex-row items-center mr-5">
              <Text className="text-2xl">🔥</Text>
              <Text
                className="text-xl ml-1.5"
                style={{ fontFamily: "CaveatBrush_400Regular", color: "#FF6B35" }}
              >
                {streakCount}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.borderLight,
                ...Platform.select({
                  ios: {
                    shadowColor: theme.shadowSm,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 4,
                  },
                  android: { elevation: 3 },
                }),
              }}
            >
              <Ionicons name="person-outline" size={20} color={theme.brand} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6">
          <View className="mb-8 mt-2">
            <Text
              className="text-[10px] uppercase tracking-widest mb-3 ml-1 font-heading"
              style={{ color: theme.textMuted }}
            >
              Live & Highlights
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="overflow-visible"
            >
              {displayStories.map((story) => {
                const isLiveEvent = story.type === "LIVE_EVENT";
                return (
                  <TouchableOpacity
                    key={story.id}
                    onPress={() => handleStoryPress(story)}
                    className="items-center mr-4"
                  >
                    <View
                      className="w-[72px] h-[72px] rounded-full border-[3px] items-center justify-center mb-1"
                      style={{
                        borderColor: isLiveEvent
                          ? theme.semantic
                          : story.type === "LIVE"
                            ? theme.brand
                            : theme.border,
                      }}
                    >
                      <View
                        className="w-[60px] h-[60px] rounded-full items-center justify-center overflow-hidden border"
                        style={{
                          backgroundColor: theme.surface,
                          borderColor: theme.borderLight,
                        }}
                      >
                        <Ionicons
                          name={
                            isLiveEvent
                              ? "calendar"
                              : story.type === "LIVE"
                                ? "flame"
                                : "images"
                          }
                          size={24}
                          color={
                            isLiveEvent
                              ? theme.semantic
                              : story.type === "LIVE"
                                ? theme.brand
                                : theme.textMuted
                          }
                        />
                      </View>
                    </View>
                    <Text
                      className="text-[9px] uppercase mt-1 w-[70px] text-center"
                      numberOfLines={1}
                      style={{ fontFamily: "Inter-Bold", color: theme.text }}
                    >
                      {isLiveEvent ? story.eventTitle : story.tribe}
                    </Text>
                    <Text
                      className="text-[8px] mt-0.5 w-[70px] text-center"
                      numberOfLines={1}
                      style={{
                        fontFamily: "Inter-Medium",
                        color: theme.textMuted,
                      }}
                    >
                      {isLiveEvent ? story.tribe : ""}
                    </Text>
                    {isLiveEvent && (
                      <View
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.semantic }}
                      >
                        <Text
                          className="text-[7px] text-white"
                          style={{ fontFamily: "Inter-Black" }}
                        >
                          LIVE
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <SparkCarousel
          availableSparks={availableSparks}
          answeredTribeSparks={answeredTribeSparks}
          onScroll={handleScroll}
          onUnlockSpark={(spark) => {
            setActiveSparkInfo(spark);
            setModalVisible(true);
          }}
          onEnterChat={(spark) =>
            router.push({
              pathname: "/tribe-chat",
              params: {
                tribeId: spark.id,
                hasAnsweredToday: answeredTribeSparks.includes(spark.tribe)
                  ? "true"
                  : "false",
              },
            })
          }
          isDark={isDark}
        />

        <View className="px-6">
          <View className="flex-row justify-between items-end mb-6">
            <Text
              className="text-base uppercase tracking-tighter font-heading"
              style={{ color: theme.text }}
            >
              Upcoming Plans
            </Text>
            <View
              className="px-3.5 py-1.5 rounded-xl flex-row items-center"
              style={{
                backgroundColor: theme.accentGoldLight,
                borderWidth: 1,
                borderColor: theme.accentGold + "30",
              }}
            >
              <Ionicons
                name="shield-outline"
                size={11}
                color={theme.accentGold}
              />
              <Text
                className="text-[11px] uppercase tracking-wider ml-1.5"
                style={{ fontFamily: "Inter-Black", color: theme.accentGold }}
              >
                {karmaPoints} Karma
              </Text>
            </View>
          </View>

          {eventStatus === "loading" && !eventsLoaded ? (
            <View>
              {[1, 2].map((i) => (
                <View
                  key={i}
                  className="mb-4 overflow-hidden"
                  style={{
                    borderRadius: 16,
                    backgroundColor: theme.cardBg,
                    borderWidth: 1.5,
                    borderColor: theme.brand,
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
                  <View className="p-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Skeleton
                          variant="circle"
                          width={28}
                          height={28}
                          isDark={isDark}
                        />
                        <View className="-ml-3.5 pl-5 pr-3 py-1 rounded-full border"
                          style={{ borderColor: theme.brand, borderWidth: 1, backgroundColor: theme.surface }}
                        >
                          <Skeleton variant="text" width={50} height={10} isDark={isDark} />
                        </View>
                      </View>
                      <Skeleton variant="text" width={50} height={10} isDark={isDark} />
                    </View>

                    <View className="flex-row justify-between items-start mt-3">
                      <View className="flex-1 mr-4">
                        <Skeleton variant="text" width={180} height={22} isDark={isDark} />
                        <View className="flex-row items-center mt-2">
                          <Skeleton variant="circle" width={11} height={11} isDark={isDark} />
                          <View className="ml-1.5">
                            <Skeleton variant="text" width={100} height={10} isDark={isDark} />
                          </View>
                        </View>
                        <View className="flex-row items-center mt-1.5">
                          <Skeleton variant="circle" width={11} height={11} isDark={isDark} />
                          <View className="ml-1.5">
                            <Skeleton variant="text" width={130} height={10} isDark={isDark} />
                          </View>
                        </View>
                      </View>
                      <View
                        className="w-14 h-14 rounded-xl items-center justify-center"
                        style={{ backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.borderLight }}
                      >
                        <Skeleton variant="text" width={28} height={8} isDark={isDark} />
                        <View className="mt-0.5">
                          <Skeleton variant="text" width={24} height={20} isDark={isDark} />
                        </View>
                      </View>
                    </View>

                    <View className="my-3" style={{ height: 1, backgroundColor: theme.borderLight }} />

                    <View className="flex-row items-center justify-between">
                      <Skeleton variant="button" width={140} height={36} isDark={isDark} />
                      <Skeleton variant="text" width={60} height={10} isDark={isDark} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : upcomingPlans?.length > 0 ? (
            upcomingPlans?.map((plan) => (
              <EventPlanCard
                key={plan.id}
                plan={plan}
                onCommit={handleCommitPlan}
                isDark={isDark}
              />
            ))
          ) : (
            <View className="py-8 items-center">
              <Text
                className="text-sm"
                style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
              >
                No upcoming plans
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: theme.overlay }}
        >
          <View
            className="p-8"
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              borderTopWidth: 1,
              borderColor: theme.borderLight,
            }}
          >
            <View
              className="w-12 h-1 rounded-full self-center mb-8"
              style={{ backgroundColor: theme.border }}
            />
            <Text
              className="text-[10px] uppercase tracking-widest mb-2 font-heading"
              style={{ color: theme.brand }}
            >
              {activeSparkInfo
                ? `${activeSparkInfo.tribe} SPARK`
                : "DAILY SPARK"}
            </Text>
            <Text
              className="text-2xl mb-8 italic"
              style={{ fontFamily: "Inter-Bold", color: theme.text }}
            >
              "{activeSparkInfo?.question}"
            </Text>
            <TextInput
              autoFocus
              multiline
              value={answer}
              onChangeText={setAnswer}
              placeholder="Your perspective..."
              placeholderTextColor={theme.placeholder}
              className="p-6 mb-8 text-lg min-h-[150px]"
              style={{
                fontFamily: "Inter-Medium",
                borderRadius: 24,
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: theme.borderLight,
                color: theme.text,
                textAlignVertical: "top",
              }}
            />
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setActiveSparkInfo(null);
                }}
                className="flex-1 py-5 rounded-xl items-center"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.borderLight,
                }}
              >
                <Text
                  className="text-[11px] uppercase tracking-wider"
                  style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
                >
                  Dismiss
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitAnswer}
                disabled={!answer.trim() || isSubmitting}
                className="flex-1 py-5 rounded-xl items-center"
                style={{
                  backgroundColor:
                    !answer.trim() || isSubmitting ? theme.border : theme.brand,
                }}
              >
                <Text
                  className="text-white text-[11px] uppercase tracking-wider font-heading"
                >
                  Activate
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </GradientBackground>
  );
}
