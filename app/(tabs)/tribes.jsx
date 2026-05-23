import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from "react-native";
import PagerView from "react-native-pager-view";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useCallback, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../../constants/Colors";
import GradientBackground from "../../components/GradientBackground";
import * as Location from "expo-location";
import {
  fetchJoinedTribes,
  fetchAvailableTribes,
  joinMultipleTribes,
  fetchTribeMemberCounts,
} from "../../store/tribeSlice";
import {
  fetchEvents,
  fetchUserRsvps,
  fetchEventRsvps,
  fetchAttendedEvents,
  fetchEventAttendees,
  fetchParticipantProfiles,
  attendEventWithLocation,
  clearEventParticipants,
} from "../../store/eventSlice";
import { fetchAllSparksForJoinedTribes } from "../../store/sparkSlice";
import {
  sendFriendRequest,
  fetchInnerCircle,
  unfriendUser,
  fetchPendingFriendRequests,
  fetchSentRequests,
} from "../../store/friendSlice";
import { subscribeToFriendRequests } from "../../lib/supabaseRealtime";
import EventPlanCard from "../../components/EventPlanCard";
import AttendeesModal from "../../components/AttendeesModal";
import TribeCard from "../../components/TribeCard";
import MyTribeCard from "../../components/MyTribeCard";
import ModernTabSelector from "../../components/ModernTabSelector";
import SearchBar from "../../components/SearchBar";
import Skeleton from "../../components/Skeleton";
import CreateDailySparkModal from "../../components/CreateDailySparkModal";

const TABS = [
  { key: "myTribes", label: "My Tribes", icon: "people-outline" },
  { key: "tribeEvents", label: "Events", icon: "calendar-outline" },
];

export default function TribesScreen() {
  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const dispatch = useDispatch();
  const router = useRouter();

  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const userId = useSelector((state) => state.auth.user?.id);
  const joinedTribes = useSelector((state) => state.tribe.joinedTribes) || [];
  const availableTribes =
    useSelector((state) => state.tribe.availableTribes) || [];
  const tribeMemberCounts =
    useSelector((state) => state.tribe.tribeMemberCounts) || {};
  const tribeStatus = useSelector((state) => state.tribe.status);
  const dailySparks =
    useSelector((state) => state.spark.dailySparkByTribe) || {};
  const sparkStatus = useSelector((state) => state.spark.status) || "idle";
  const events = useSelector((state) => state.event.events) || [];
  const eventStatus = useSelector((state) => state.event.status);
  const eventsLoaded = useSelector((state) => state.event.eventsLoaded);
  const committedEvents =
    useSelector((state) => state.event.committedEvents) || [];
  const attendedEvents =
    useSelector((state) => state.event.attendedEvents) || [];
  const eventRsvps = useSelector((state) => state.event.eventRsvps) || {};
  const eventParticipants =
    useSelector((state) => state.event.eventParticipants) || {};
  const innerCircle = useSelector((state) => state.friend.innerCircle) || [];
  const pendingRequests =
    useSelector((state) => state.friend.pendingRequests) || [];
  const sentRequests = useSelector((state) => state.friend.sentRequests) || [];

  const [activeTab, setActiveTab] = useState("myTribes");
  const [isJoiningTribe, setIsJoiningTribe] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isAttendeesModalVisible, setIsAttendeesModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventAttendeesList, setEventAttendeesList] = useState([]);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCreateSparkVisible, setIsCreateSparkVisible] = useState(false);

  const isSparkCreator = useSelector(
    (state) => state.auth.user?.is_spark_creator,
  );

  const pagerRef = useRef(null);
  const sparksEverLoaded = useRef(false);

  useEffect(() => {
    if (sparkStatus === "succeeded") {
      sparksEverLoaded.current = true;
    }
  }, [sparkStatus]);

  const handleTabChange = (tabKey) => {
    if (activeTab === tabKey) return;
    setActiveTab(tabKey);
    const index = TABS.findIndex((t) => t.key === tabKey);
    pagerRef.current?.setPage(index);
  };

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      dispatch(fetchAvailableTribes());
      dispatch(fetchJoinedTribes(userId));
      dispatch(fetchEvents());
      dispatch(fetchUserRsvps(userId));
      dispatch(fetchPendingFriendRequests(userId));
      dispatch(fetchSentRequests(userId));
    }, [dispatch, userId]),
  );

  useEffect(() => {
    if (userId) {
      dispatch(fetchAttendedEvents(userId));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (joinedTribes.length > 0) {
      dispatch(fetchAllSparksForJoinedTribes(joinedTribes));
    }
  }, [joinedTribes, dispatch]);

  useEffect(() => {
    if (availableTribes.length > 0) {
      const allTribeIds = availableTribes.map((t) => t.id);
      dispatch(fetchTribeMemberCounts(allTribeIds));
    }
  }, [availableTribes, dispatch]);

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
    if (!userId) return;
    const unsubscribe = subscribeToFriendRequests(userId, (update) => {
      if (update.type === "request_accepted") {
        dispatch(fetchInnerCircle(userId));
        dispatch(fetchSentRequests(userId));
        dispatch(fetchPendingFriendRequests(userId));
      } else if (update.type === "unfriend") {
        dispatch(fetchInnerCircle(userId));
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [userId, dispatch]);

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
        console.log("[TRIBES] Error getting location:", error);
      }
    })();
  }, []);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
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

  const now = new Date();
  const joinedTribeIds = new Set(joinedTribes.map((t) => t.id));
  const tribeEvents = events.filter((e) => joinedTribeIds.has(e.tribe_id));

  const handleIAmIn = async (eventId) => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }
    setIsCheckingIn(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }
      await dispatch(attendEventWithLocation({ userId, eventId })).unwrap();
      await dispatch(fetchUserRsvps(userId));
      Alert.alert("Check-in Successful!", "Location verified!");
    } catch (err) {
      Alert.alert("Error", err || "Failed to check in.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const pastEvents = tribeEvents
    .filter((event) => {
      const end = new Date(event.end_time);
      return end < now;
    })
    .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
    .slice(0, 3);

  const attendedEventIds = new Set(attendedEvents.map((a) => a.event_id));

  const handleViewAttendees = async (event) => {
    setSelectedEvent(event);
    setIsAttendeesModalVisible(true);
    setIsLoadingAttendees(true);
    dispatch(clearEventParticipants());
    setEventAttendeesList([]);
    try {
      const action = await dispatch(fetchEventAttendees(event.id)).unwrap();
      const attendees = action || [];
      const userIds = attendees.map((a) => a.user_id);
      if (userIds.length > 0) {
        await dispatch(fetchParticipantProfiles(userIds));
      }
      setEventAttendeesList(attendees);
    } catch (err) {
      console.log("Error fetching attendees:", err);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  const handleSendFriendRequest = async (attendeeUserId, eventId) => {
    if (!userId) {
      Alert.alert("Error", "You must be logged in to send friend requests.");
      return;
    }
    setIsSendingRequest(true);
    try {
      await dispatch(
        sendFriendRequest({
          senderId: userId,
          receiverId: attendeeUserId,
          metAtEventId: eventId,
        }),
      ).unwrap();
      await dispatch(fetchSentRequests(userId));
      Alert.alert(
        "Friend Request Sent!",
        "You can now connect with this person.",
      );
    } catch (err) {
      Alert.alert("Error", err || "Failed to send friend request.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleUnfriend = async (friendId) => {
    if (!userId) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }
    Alert.alert("Unfriend", "Are you sure you want to unfriend this person?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unfriend",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(unfriendUser({ userId, friendId })).unwrap();
            await dispatch(fetchInnerCircle(userId));
            Alert.alert("Unfriend Successful!", "You are no longer friends.");
          } catch (err) {
            Alert.alert("Error", err || "Failed to unfriend.");
          }
        },
      },
    ]);
  };

  const isAlreadyFriends = (otherUserId) => {
    return innerCircle.some(
      (f) =>
        ((f.user1_id === userId && f.user2_id === otherUserId) ||
          (f.user2_id === userId && f.user1_id === otherUserId)) &&
        f.status === "accepted",
    );
  };

  const isRequestSent = (otherUserId) => {
    return sentRequests.some(
      (f) =>
        f.user1_id === userId &&
        f.user2_id === otherUserId &&
        f.status === "pending",
    );
  };

  const isRequestReceived = (otherUserId) => {
    return pendingRequests.some(
      (f) =>
        f.user2_id === userId &&
        f.user1_id === otherUserId &&
        f.status === "pending",
    );
  };

  const getFriendStatus = (otherUserId) => {
    return isAlreadyFriends(otherUserId)
      ? "friends"
      : isRequestSent(otherUserId)
        ? "pendingSent"
        : isRequestReceived(otherUserId)
          ? "pendingReceived"
          : "none";
  };

  const displayTribes =
    availableTribes && availableTribes.length > 0 ? availableTribes : [];
  const checkIfJoined = (tribeId) =>
    joinedTribes.some((tribe) => tribe.id === tribeId);

  const filteredJoined = joinedTribes.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredDiscover = displayTribes.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleJoinTribe = async (tribe) => {
    if (!userId || !tribe?.id) return;
    setIsJoiningTribe(true);
    try {
      await dispatch(
        joinMultipleTribes({ userId, tribeIds: [tribe.id] }),
      ).unwrap();
      await dispatch(fetchJoinedTribes(userId)).unwrap();
      Alert.alert("Success!", `You've joined ${tribe.name}!`);
    } catch (err) {
      Alert.alert(
        "Error",
        err?.message || "Failed to join tribe. Please try again.",
      );
    } finally {
      setIsJoiningTribe(false);
    }
  };

  const renderMyTribesPage = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search tribes..."
        isDark={isDark}
      />

      {filteredJoined.length > 0 && (
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons
                name="people-circle-outline"
                size={20}
                color={theme.brand}
              />
              <Text
                className="text-lg uppercase tracking-tighter ml-2 font-heading"
                style={{ color: theme.text }}
              >
                MY TRIBES
              </Text>
            </View>
            <Text
              className="text-xs"
              style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
            >
              {filteredJoined.length}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, paddingRight: 16 }}
            nestedScrollEnabled
            onTouchStart={() => setPagerScrollEnabled(false)}
            onTouchEnd={() => setPagerScrollEnabled(true)}
            onScrollEndDrag={() => setPagerScrollEnabled(true)}
            onMomentumScrollEnd={() => setPagerScrollEnabled(true)}
          >
            {!sparksEverLoaded.current && sparkStatus !== "succeeded"
              ? [1, 2, 3].map((i) => (
                  <View
                    key={i}
                    className="mr-3 p-4 justify-between"
                    style={{
                      width: 160,
                      height: 130,
                      borderRadius: theme.cardRadius,
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.borderLight,
                    }}
                  >
                    <View className="items-center pt-1">
                      <Skeleton
                        variant="circle"
                        width={48}
                        height={48}
                        isDark={isDark}
                      />
                      <View className="mt-2">
                        <Skeleton
                          variant="text"
                          width={80}
                          height={12}
                          isDark={isDark}
                        />
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Skeleton
                        variant="text"
                        width={50}
                        height={10}
                        isDark={isDark}
                      />
                      <Skeleton
                        variant="circle"
                        width={10}
                        height={10}
                        isDark={isDark}
                      />
                    </View>
                  </View>
                ))
              : filteredJoined.map((item) => {
                  const sparkData = dailySparks[item.id];
                  const hasSparkToday = !!sparkData?.id;
                  const isUnlocked =
                    hasSparkToday && sparkData?.answered_by?.includes(userId);
                  return (
                    <MyTribeCard
                      key={item.id}
                      tribe={{ ...item, hasAnsweredToday: isUnlocked }}
                      onPress={() =>
                        router.push({
                          pathname: "/tribe-details",
                          params: { tribeId: item.id, tribeName: item.name },
                        })
                      }
                      isDark={isDark}
                    />
                  );
                })}
          </ScrollView>
        </View>
      )}

      {tribeStatus === "loading" && availableTribes.length === 0 ? (
        <View className="mb-8">
          <View className="mb-4">
            <Skeleton variant="text" width={100} height={12} isDark={isDark} />
          </View>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="mb-3 overflow-hidden"
              style={{
                borderRadius: theme.elementRadius,
                backgroundColor: theme.bg,
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
              <View
                style={{
                  height: 4,
                  backgroundColor: theme.border,
                  borderTopLeftRadius: theme.elementRadius,
                }}
              />
              <View className="p-4">
                <View className="flex-row items-center">
                  <Skeleton
                    variant="circle"
                    width={44}
                    height={44}
                    isDark={isDark}
                  />
                  <View className="ml-3 flex-1">
                    <Skeleton
                      variant="text"
                      width={140}
                      height={16}
                      isDark={isDark}
                    />
                    <View className="mt-2">
                      <Skeleton
                        variant="text"
                        width={100}
                        height={12}
                        isDark={isDark}
                      />
                    </View>
                  </View>
                </View>
                <View className="mt-3">
                  <Skeleton
                    variant="button"
                    width={80}
                    height={32}
                    isDark={isDark}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="mb-8">
          <Text
            className="text-[10px] uppercase tracking-widest mb-3 font-heading"
            style={{ color: theme.textMuted }}
          >
            Discover Tribes
          </Text>
          {filteredDiscover.length === 0 &&
          searchQuery.length === 0 ? null : filteredDiscover.length === 0 ? (
            <Text
              className="text-sm text-center py-8"
              style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
            >
              No tribes found for "{searchQuery}"
            </Text>
          ) : (
            filteredDiscover.map((item) => (
              <TribeCard
                key={item.id}
                tribe={item}
                isJoined={checkIfJoined(item.id)}
                onJoin={handleJoinTribe}
                onPress={() =>
                  router.push({
                    pathname: "/tribe-details",
                    params: { tribeId: item.id, tribeName: item.name },
                  })
                }
                memberCount={tribeMemberCounts[item.id] || 0}
                isDark={isDark}
              />
            ))
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderEventsPage = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {eventStatus === "loading" && !eventsLoaded ? (
        <View className="mb-8">
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
                    <View
                      className="-ml-3.5 pl-5 pr-3 py-1 rounded-full border"
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
      ) : tribeEvents.length > 0 ? (
        <View>
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.semantic }}
              />
              <Text
                className="text-sm uppercase ml-2 tracking-wider"
                style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
              >
                Ongoing
              </Text>
            </View>
            {tribeEvents
              .filter((e) => {
                const start = new Date(e.start_time);
                const end = new Date(e.end_time);
                return start <= now && end > now;
              })
              .map((event) => {
                const tribeName = joinedTribes?.find(
                  (t) => t.id === event.tribe_id,
                )?.name;
                const isCommitted = committedEvents.includes(event.id);
                const isAttended = attendedEvents.some(
                  (a) => a.event_id === event.id,
                );
                const isNear = isNearEvent(event.lat, event.lng);
                const eventRsvpUserIds = eventRsvps[event.id] || [];
                return (
                  <EventPlanCard
                    key={event.id}
                    plan={{
                      ...event,
                      tribe_name: tribeName,
                      committed: isCommitted,
                      type: "ongoing",
                    }}
                    onCheckIn={handleIAmIn}
                    onViewAttendees={handleViewAttendees}
                    isCheckingIn={isCheckingIn}
                    isDark={isDark}
                  />
                );
              })}
          </View>
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="time-outline" size={14} color={theme.textMuted} />
              <Text
                className="text-sm uppercase ml-2 tracking-wider"
                style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
              >
                Past
              </Text>
            </View>
            {pastEvents.map((event) => {
              const tribeName = joinedTribes?.find(
                (t) => t.id === event.tribe_id,
              )?.name;
              return (
                <EventPlanCard
                  key={event.id}
                  plan={{ ...event, tribe_name: tribeName, type: "past" }}
                  onViewAttendees={handleViewAttendees}
                  isDark={isDark}
                />
              );
            })}
          </View>
        </View>
      ) : (
        <View className="py-16 items-center">
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: theme.surface }}
          >
            <Ionicons
              name="calendar-outline"
              size={36}
              color={theme.textMuted}
            />
          </View>
          <Text
            className="text-base mb-1"
            style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
          >
            No events yet
          </Text>
          <Text
            className="text-sm text-center px-8"
            style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
          >
            Events from your tribes will appear here
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <GradientBackground
      isDark={isDark}
      style={{ paddingTop: 56, paddingLeft: 16, paddingRight: 16 }}
    >
      <View className="flex-row justify-between items-center mb-6 px-1">
        <Text
          className="text-3xl uppercase tracking-tighter font-heading"
          style={{ color: theme.brand }}
        >
          Tribes
        </Text>
        <TouchableOpacity
          className="w-12 h-12 items-center justify-center rounded-xl"
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.borderLight,
          }}
          onPress={() => setIsMenuVisible(true)}
        >
          <Ionicons name="menu-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ModernTabSelector
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDark={isDark}
      />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        offscreenPageLimit={2}
        pageMargin={16}
        scrollEnabled={pagerScrollEnabled}
        overScrollMode="never"
        onPageSelected={(e) => setActiveTab(TABS[e.nativeEvent.position].key)}
      >
        <View key="myTribes" collapsable={false}>
          {renderMyTribesPage()}
        </View>
        <View key="tribeEvents" collapsable={false}>
          {renderEventsPage()}
        </View>
      </PagerView>

      <AttendeesModal
        visible={isAttendeesModalVisible}
        onClose={() => setIsAttendeesModalVisible(false)}
        eventTitle={selectedEvent?.title}
        attendees={eventAttendeesList}
        eventParticipants={eventParticipants}
        userId={userId}
        isDark={isDark}
        friendStatusMap={getFriendStatus}
        onSendFriendRequest={(attendeeUserId) =>
          handleSendFriendRequest(attendeeUserId, selectedEvent?.id)
        }
        isSendingRequest={isSendingRequest}
        hasAttendedEvent={attendedEventIds.has(selectedEvent?.id)}
        isLoading={isLoadingAttendees}
      />

      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.overlay }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setIsMenuVisible(false)}
          />
          <View
            className="p-6 pb-10"
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
            }}
          >
            <View
              className="w-10 h-1 rounded-full self-center mb-6"
              style={{ backgroundColor: theme.borderLight }}
            />
            <Text
              className="text-xl uppercase tracking-tighter font-heading mb-6"
              style={{ color: theme.text }}
            >
              Menu
            </Text>

            {isSparkCreator && (
              <TouchableOpacity
                className="flex-row items-center py-4 px-2 rounded-xl mb-2"
                style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.borderLight }}
                onPress={() => {
                  setIsMenuVisible(false);
                  setIsCreateSparkVisible(true);
                }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: theme.brandLight }}
                >
                  <Ionicons name="bulb-outline" size={22} color={theme.brand} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm"
                    style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
                  >
                    Create Daily Spark
                  </Text>
                  <Text
                    className="text-xs mt-0.5"
                    style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
                  >
                    Post a question for a tribe today
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <CreateDailySparkModal
        visible={isCreateSparkVisible}
        onClose={() => setIsCreateSparkVisible(false)}
        tribes={availableTribes}
        isDark={isDark}
      />
    </GradientBackground>
  );
}
