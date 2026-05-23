import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
  BackHandler,
} from "react-native";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import PagerView from "react-native-pager-view";
import { Colors } from "../../constants/Colors";
import GradientBackground from "../../components/GradientBackground";
import * as Location from "expo-location";
import {
  fetchInnerCircle,
  fetchInnerCircleWithProfiles,
  fetchPendingFriendRequests,
  fetchPendingRequestsWithProfiles,
  fetchSentRequests,
  fetchMetAtEventUsers,
  acceptFriendRequest,
  declineFriendRequest,
  unfriendUser,
  addPendingRequest,
  addPendingRequestProfile,
  clearFriendState,
} from "../../store/friendSlice";
import {
  fetchChatRequests,
  respondToChatRequestThunk,
  clearChatState,
} from "../../store/chatSlice";
import { getProfilesByIds } from "../../lib/api/profiles";
import {
  subscribeToFriendRequests,
  subscribeToFriendEventInvites,
} from "../../lib/supabaseRealtime";
import {
  fetchCommittedFriendEvents,
  fetchPendingEventInvites,
  respondToFriendEventInviteThunk,
  createFriendEventThunk,
  fetchFriendEventAttendeeCounts,
} from "../../store/eventSlice";
import EventCard from "../../components/EventCard";
import CreatePlanModal from "../../components/CreatePlanModal";
import FriendRow from "../../components/FriendRow";
import ModernTabSelector from "../../components/ModernTabSelector";
import AvatarWithInitials from "../../components/AvatarWithInitials";
import Skeleton from "../../components/Skeleton";

const TABS = [
  { key: "friends", label: "Friends", icon: "people-outline" },
  { key: "live", label: "Live", icon: "radio-outline" },
  { key: "plans", label: "Plans", icon: "calendar-outline" },
];

export default function InnerCircleScreen() {
  const insets = useSafeAreaInsets();
  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const dispatch = useDispatch();
  const router = useRouter();
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const userId = useSelector((state) => state.auth.user?.id);
  const innerCircle = useSelector((state) => state.friend.innerCircle);
  const innerCircleProfiles =
    useSelector((state) => state.friend.innerCircleProfiles) || {};
  const pendingRequests = useSelector((state) => state.friend.pendingRequests);
  const pendingRequestProfiles =
    useSelector((state) => state.friend.pendingRequestProfiles) || {};
  const sentRequests = useSelector((state) => state.friend.sentRequests);
  const sentRequestProfiles =
    useSelector((state) => state.friend.sentRequestProfiles) || {};
  const metAtEventUsers = useSelector((state) => state.friend.metAtEventUsers);
  const friendStatus = useSelector((state) => state.friend.status);
  const chatRequests = useSelector((state) => state.chat.chatRequests);
  const pendingFriendEventInvites = useSelector(
    (state) => state.event.pendingFriendEventInvites || [],
  );
  const committedFriendEvents = useSelector(
    (state) => state.event.committedFriendEvents || [],
  );
  const friendEventAttendeeCounts = useSelector(
    (state) => state.event.friendEventAttendeeCounts || {},
  );

  const [isPlanModalVisible, setPlanModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventLat, setEventLat] = useState(null);
  const [eventLng, setEventLng] = useState(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [startTime, setStartTime] = useState({
    hr: "10",
    min: "00",
    period: "AM",
  });
  const [endTime, setEndTime] = useState({ hr: "05", min: "00", period: "PM" });
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isInvitesModalVisible, setInvitesModalVisible] = useState(false);
  const [isUnfriending, setIsUnfriending] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);

  const pagerRef = useRef(null);

  const handleTabChange = (tabKey) => {
    if (activeTab === tabKey) return;
    setActiveTab(tabKey);
    const index = TABS.findIndex((t) => t.key === tabKey);
    pagerRef.current?.setPage(index);
  };

  const nowRef = useRef(new Date());

  const liveFriendCards = useMemo(() => {
    const n = nowRef.current;
    return committedFriendEvents.filter((rsvp) => {
      const event = rsvp.events;
      if (!event) return false;
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      return start <= n && end >= n;
    });
  }, [committedFriendEvents]);

  const mergedUpcoming = useMemo(() => {
    const n = nowRef.current;
    const mergedMap = new Map();
    pendingFriendEventInvites.forEach((rsvp) => {
      if (rsvp.events) {
        const start = new Date(rsvp.events.start_time);
        if (start > n)
          mergedMap.set(rsvp.event_id, { rsvp, status: "invited" });
      }
    });
    committedFriendEvents.forEach((rsvp) => {
      if (rsvp.events) {
        const start = new Date(rsvp.events.start_time);
        if (start > n)
          mergedMap.set(rsvp.event_id, { rsvp, status: "committed" });
      }
    });
    const merged = Array.from(mergedMap.values());
    merged.sort(
      (a, b) =>
        new Date(a.rsvp.events?.start_time) -
        new Date(b.rsvp.events?.start_time),
    );
    return merged;
  }, [pendingFriendEventInvites, committedFriendEvents]);

  const filteredFriends = useMemo(() => {
    if (!innerCircle) return [];
    return innerCircle.filter((friend) => {
      const friendId =
        friend.user1_id === userId ? friend.user2_id : friend.user1_id;
      const friendProfile = innerCircleProfiles[friendId] || {};
      const friendName = (
        friendProfile.full_name ||
        friendProfile.username ||
        ""
      ).toLowerCase();
      return friendName.includes(searchQuery.toLowerCase());
    });
  }, [innerCircle, innerCircleProfiles, searchQuery, userId]);

  const handleUnfriend = async (friendId) => {
    if (!userId) return;
    setIsUnfriending(true);
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
          } finally {
            setIsUnfriending(false);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("[INNER-CIRCLE]: Location permission denied");
      }
    })();
  }, []);

  useEffect(() => {
    if (userId) {
      dispatch(fetchInnerCircleWithProfiles(userId));
      dispatch(fetchPendingRequestsWithProfiles(userId));
      dispatch(fetchSentRequests(userId));
      dispatch(fetchMetAtEventUsers(userId));
      dispatch(fetchChatRequests(userId));
      dispatch(fetchCommittedFriendEvents(userId));
      dispatch(fetchPendingEventInvites(userId));
    }
    return () => {
      dispatch(clearFriendState());
      dispatch(clearChatState());
    };
  }, [dispatch, userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      dispatch(fetchPendingEventInvites(userId));
      dispatch(fetchCommittedFriendEvents(userId));
    }, [dispatch, userId]),
  );

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToFriendRequests(userId, async (update) => {
      if (update.type === "new_request") {
        dispatch(addPendingRequest(update.data));
        if (update.data.user1_id) {
          const { data: profiles } = await getProfilesByIds([
            update.data.user1_id,
          ]);
          if (profiles && profiles.length > 0) {
            dispatch(
              addPendingRequestProfile({
                userId: update.data.user1_id,
                profile: profiles[0],
              }),
            );
          }
        }
        await dispatch(fetchPendingRequestsWithProfiles(userId));
      } else if (update.type === "request_accepted") {
        await dispatch(fetchInnerCircleWithProfiles(userId));
        await dispatch(fetchSentRequests(userId));
      } else if (update.type === "request_updated") {
        await dispatch(fetchPendingRequestsWithProfiles(userId));
        await dispatch(fetchInnerCircleWithProfiles(userId));
      } else if (update.type === "unfriend") {
        await dispatch(fetchInnerCircleWithProfiles(userId));
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [userId, dispatch]);

  useEffect(() => {
    if (!userId) return;
    const eventInviteUnsubscribe = subscribeToFriendEventInvites(
      userId,
      async (update) => {
        if (update.type === "new_event_invite") {
          await dispatch(fetchPendingEventInvites(userId));
        } else if (update.type === "event_invite_updated") {
          await dispatch(fetchPendingEventInvites(userId));
          await dispatch(fetchCommittedFriendEvents(userId));
        }
      },
    );
    return () => {
      if (typeof eventInviteUnsubscribe === "function")
        eventInviteUnsubscribe();
    };
  }, [userId, dispatch]);

  useEffect(() => {
    const allEvents = [
      ...(pendingFriendEventInvites || []),
      ...(committedFriendEvents || []),
    ];
    const eventIds = [
      ...new Set(allEvents.map((rsvp) => rsvp.event_id).filter(Boolean)),
    ];
    if (eventIds.length > 0) {
      dispatch(fetchFriendEventAttendeeCounts(eventIds));
    }
  }, [pendingFriendEventInvites, committedFriendEvents, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      nowRef.current = new Date();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptRequest = async (friendshipId) => {
    if (!friendshipId || !userId) return;
    try {
      await dispatch(acceptFriendRequest({ friendshipId })).unwrap();
      await dispatch(fetchPendingRequestsWithProfiles(userId));
      await dispatch(fetchInnerCircleWithProfiles(userId));
      Alert.alert("Accepted!", "You're now friends!");
    } catch (err) {
      Alert.alert("Error", err || "Failed to accept request.");
    }
  };

  const handleDeclineRequest = async (friendshipId) => {
    if (!friendshipId || !userId) return;
    await dispatch(declineFriendRequest({ friendshipId }));
    dispatch(fetchPendingFriendRequests(userId));
    Alert.alert("Declined", "Friend request declined.");
  };

  const handleCreateFriendEvent = async () => {
    if (
      !eventTitle.trim() ||
      !eventLocation.trim() ||
      selectedFriends.length === 0
    ) {
      Alert.alert(
        "Error",
        "Fill in all fields and select at least one friend.",
      );
      return;
    }
    const selectedDateTime = new Date();
    selectedDateTime.setDate(selectedDateTime.getDate() + selectedDate);
    let sHr = parseInt(startTime.hr);
    if (startTime.period === "AM" && sHr === 12) sHr = 0;
    if (startTime.period === "PM" && sHr !== 12) sHr += 12;
    let eHr = parseInt(endTime.hr);
    if (endTime.period === "AM" && eHr === 12) eHr = 0;
    if (endTime.period === "PM" && eHr !== 12) eHr += 12;
    const startTimestamp = new Date(selectedDateTime);
    startTimestamp.setHours(sHr, parseInt(startTime.min), 0, 0);
    const endTimestamp = new Date(selectedDateTime);
    endTimestamp.setHours(eHr, parseInt(endTime.min), 0, 0);

    const eventPayload = {
      title: eventTitle.trim(),
      description: `Friend event by ${userId}`,
      start_time: startTimestamp.toISOString(),
      end_time: endTimestamp.toISOString(),
      event_type: "FRIEND_EVENT",
      tribe_id: null,
      creator_id: userId,
      karma_cost: 0,
      location_name: eventLocation.trim(),
      lat: eventLat,
      lng: eventLng,
    };

    const result = await dispatch(
      createFriendEventThunk({ eventPayload, invitedFriends: selectedFriends }),
    );
    if (createFriendEventThunk.fulfilled.match(result)) {
      setPlanModalVisible(false);
      setEventTitle("");
      setEventLocation("");
      setEventLat(null);
      setEventLng(null);
      setSelectedFriends([]);
      dispatch(fetchCommittedFriendEvents(userId));
      Alert.alert("Success!", "Friend event created and invites sent!");
    } else {
      Alert.alert("Error", "Failed to create friend event.");
    }
  };

  const handleAcceptInviteFromCard = async (eventId) => {
    if (!userId) return;
    try {
      await dispatch(
        respondToFriendEventInviteThunk({
          userId,
          eventId,
          status: "committed",
        }),
      ).unwrap();
      await dispatch(fetchPendingEventInvites(userId));
      await dispatch(fetchCommittedFriendEvents(userId));
      Alert.alert("Accepted!", "You're going to this event.");
    } catch (err) {
      Alert.alert("Error", err || "Failed to accept invite.");
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isPlanModalVisible) {
          setPlanModalVisible(false);
          return true;
        }
        if (isInvitesModalVisible) {
          setInvitesModalVisible(false);
          return true;
        }
        return false;
      },
    );
    return () => backHandler.remove();
  }, [isPlanModalVisible, isInvitesModalVisible]);

  const renderFriendsTab = () => (
    <View className="flex-1 px-4">
      <View
        className="flex-row items-center mb-3 px-4"
        style={{
          borderRadius: theme.elementRadius,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.borderLight,
          height: 48,
        }}
      >
        <Ionicons name="search" size={16} color={theme.brand} />
        <TextInput
          placeholder="Search friends..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 ml-2.5 text-sm"
          style={{ fontFamily: "Inter-Medium", color: theme.text }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {friendStatus === "loading" && innerCircle.length === 0 ? (
        Array(5)
          .fill(null)
          .map((_, i) => (
            <View
              key={i}
              className="flex-row items-center py-3.5"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: theme.borderLight,
              }}
            >
              <Skeleton
                variant="circle"
                width={44}
                height={44}
                isDark={isDark}
              />
              <View className="ml-3 flex-1">
                <Skeleton
                  variant="text"
                  width={120}
                  height={14}
                  isDark={isDark}
                />
                <View className="mt-1">
                  <Skeleton
                    variant="text"
                    width={60}
                    height={10}
                    isDark={isDark}
                  />
                </View>
              </View>
            </View>
          ))
      ) : filteredFriends.length > 0 ? (
        filteredFriends.map((friend) => {
          const friendId =
            friend.user1_id === userId ? friend.user2_id : friend.user1_id;
          const friendProfile = innerCircleProfiles[friendId] || {};
          return (
            <FriendRow
              key={friend.id}
              friend={friendProfile}
              isDark={isDark}
              onPress={() =>
                router.push({
                  pathname: "/private-chat",
                  params: {
                    friendId,
                    friendName:
                      friendProfile.full_name ||
                      friendProfile.username ||
                      "Friend",
                  },
                })
              }
              onLongPress={() => handleUnfriend(friendId)}
            />
          );
        })
      ) : (
        <View className="py-16 items-center">
          <Ionicons name="people-outline" size={36} color={theme.textMuted} />
          <Text
            className="text-sm mt-3"
            style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
          >
            {searchQuery ? "No friends found" : "No friends yet"}
          </Text>
        </View>
      )}
    </View>
  );

  const renderLiveTab = () => {
    if (liveFriendCards.length === 0) {
      return (
        <View className="py-16 items-center">
          <Ionicons name="radio-outline" size={36} color={theme.textMuted} />
          <Text
            className="text-sm mt-3"
            style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
          >
            No live events right now
          </Text>
        </View>
      );
    }
    return (
      <View className="px-6 pt-2">
        {liveFriendCards.map((rsvp) => {
          const event = rsvp.events;
          if (!event) return null;
          return (
            <EventCard
              key={rsvp.id}
              event={event}
              type="friend-invite"
              inviteStatus="committed"
              isLive={true}
              attendeeCount={friendEventAttendeeCounts[rsvp.event_id] || 0}
              isDark={isDark}
            />
          );
        })}
      </View>
    );
  };

  const renderPlansTab = () => (
    <View className="px-6 pt-2">
      {mergedUpcoming.length > 0 ? (
        mergedUpcoming.map(({ rsvp, status }) => {
          const event = rsvp.events;
          if (!event) return null;
          return (
            <EventCard
              key={rsvp.id}
              event={event}
              type="friend-invite"
              inviteStatus={status}
              attendeeCount={friendEventAttendeeCounts[rsvp.event_id] || 0}
              onAcceptInvite={handleAcceptInviteFromCard}
              isDark={isDark}
            />
          );
        })
      ) : (
        <View className="py-16 items-center">
          <Ionicons name="calendar-outline" size={36} color={theme.textMuted} />
          <Text
            className="text-sm mt-3"
            style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
          >
            No upcoming plans
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <GradientBackground
      isDark={isDark}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text
          className="text-3xl uppercase tracking-tighter font-heading"
          style={{ color: theme.brand }}
        >
          Inner Circle
        </Text>
        <TouchableOpacity
          className="p-2 relative"
          onPress={() => setInvitesModalVisible(true)}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={theme.brand}
          />
          {(chatRequests?.length > 0 ||
            pendingRequests?.length > 0 ||
            pendingFriendEventInvites?.length > 0) && (
            <View
              className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.brand }}
            >
              <Text
                className="text-[9px] text-white"
                style={{ fontFamily: "Inter-Black" }}
              >
                {(chatRequests?.length || 0) +
                  (pendingRequests?.length || 0) +
                  (pendingFriendEventInvites?.length || 0)}
              </Text>
            </View>
          )}
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
        scrollEnabled={pagerScrollEnabled}
        onPageSelected={(e) => setActiveTab(TABS[e.nativeEvent.position].key)}
      >
        <View key="friends" collapsable={false}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {renderFriendsTab()}
          </ScrollView>
        </View>
        <View key="live" collapsable={false}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {renderLiveTab()}
          </ScrollView>
        </View>
        <View key="plans" collapsable={false}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {renderPlansTab()}
          </ScrollView>
        </View>
      </PagerView>

      <TouchableOpacity
        onPress={() => setPlanModalVisible(true)}
        className="absolute w-14 h-14 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: theme.brand,
          bottom: insets.bottom + 90,
          right: 20,
          ...Platform.select({
            ios: {
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 8,
            },
            android: { elevation: 6 },
          }),
        }}
      >
        <Ionicons name="calendar" size={24} color="white" />
      </TouchableOpacity>

      <CreatePlanModal
        visible={isPlanModalVisible}
        onClose={() => setPlanModalVisible(false)}
        eventTitle={eventTitle}
        setEventTitle={setEventTitle}
        eventLocation={eventLocation}
        setEventLocation={setEventLocation}
        eventLat={eventLat}
        eventLng={eventLng}
        setEventLat={setEventLat}
        setEventLng={setEventLng}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        selectedFriends={selectedFriends}
        toggleFriendSelection={toggleFriendSelection}
        innerCircle={innerCircle}
        innerCircleProfiles={innerCircleProfiles}
        userId={userId}
        onSubmit={handleCreateFriendEvent}
        isDark={isDark}
      />

      <Modal
        visible={isInvitesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInvitesModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.overlay }}>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <View
              className="px-2"
              style={{
                backgroundColor: theme.surface,
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
                borderTopWidth: 1,
                borderColor: theme.borderLight,
                height: "84%",
                maxHeight: "92%",
                overflow: "hidden",
              }}
            >
              <View
                className="w-12 h-1 rounded-full self-center my-4"
                style={{ backgroundColor: theme.border }}
              />
              <View className="flex-row w-full items-center justify-center mb-4">
                <Text
                  className="text-xl uppercase tracking-tighter font-heading"
                  style={{ color: theme.brand }}
                >
                  Pending Invites
                </Text>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
              >
                {pendingRequests && pendingRequests.length > 0 && (
                  <View className="mb-4 px-2">
                      <Text
                        className="text-sm uppercase mb-2 tracking-wider font-heading"
                        style={{
                          color: theme.textMuted,
                        }}
                      >
                        Friend Requests ({pendingRequests.length})
                    </Text>
                    {pendingRequests.map((request) => {
                      const senderProfile =
                        pendingRequestProfiles[request.user1_id];
                      const senderName =
                        senderProfile?.full_name ||
                        senderProfile?.username ||
                        null;
                      const initials = senderName
                        ? senderName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "?";
                      return (
                        <View
                          key={request.id}
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
                          <View className="p-4">
                            <View className="flex-row items-center">
                              <View
                                className="w-10 h-10 rounded-xl items-center justify-center"
                                style={{ backgroundColor: theme.brandLight }}
                              >
                                <Text
                                  className="text-xs text-white"
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
                                  {senderName || "Loading..."}
                                </Text>
                                <Text
                                  className="text-[11px]"
                                  style={{
                                    fontFamily: "Inter-Medium",
                                    color: theme.textMuted,
                                  }}
                                >
                                  Wants to connect
                                </Text>
                              </View>
                              <View className="flex-row ml-2 gap-2">
                                <TouchableOpacity
                                  onPress={() =>
                                    handleAcceptRequest(request.id)
                                  }
                                  className="px-4 py-2 rounded-xl"
                                  style={{ backgroundColor: theme.brand }}
                                >
                                  <Text
                                    className="text-white text-[10px] uppercase tracking-wider"
                                    style={{ fontFamily: "Inter-Bold" }}
                                  >
                                    Accept
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() =>
                                    handleDeclineRequest(request.id)
                                  }
                                  className="px-4 py-2 rounded-xl"
                                  style={{ backgroundColor: theme.surface }}
                                >
                                  <Text
                                    className="text-[10px] uppercase tracking-wider"
                                    style={{
                                      fontFamily: "Inter-Bold",
                                      color: theme.textMuted,
                                    }}
                                  >
                                    Decline
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {sentRequests && sentRequests.length > 0 && (
                  <View className="mb-4 px-2">
                      <Text
                        className="text-sm uppercase mb-2 tracking-wider font-heading"
                        style={{
                          color: theme.textMuted,
                        }}
                      >
                        Sent Requests ({sentRequests.length})
                    </Text>
                    {sentRequests.map((request) => {
                      const receiverProfile =
                        sentRequestProfiles[request.user2_id] || {};
                      const receiverName =
                        receiverProfile.full_name ||
                        receiverProfile.username ||
                        "Someone";
                      const initials = receiverName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      return (
                        <View
                          key={request.id}
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
                          <View className="p-4">
                            <View className="flex-row items-center">
                              <View
                                className="w-10 h-10 rounded-xl items-center justify-center"
                                style={{
                                  backgroundColor: theme.accentGoldLight,
                                }}
                              >
                                <Text
                                  className="text-xs"
                                  style={{
                                    fontFamily: "Inter-Bold",
                                    color: theme.accentGold,
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
                                  {receiverName}
                                </Text>
                                <Text
                                  className="text-[11px]"
                                  style={{
                                    fontFamily: "Inter-Medium",
                                    color: theme.textMuted,
                                  }}
                                >
                                  Request pending
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {chatRequests && chatRequests.length > 0 && (
                  <View className="mb-4 px-2">
                      <Text
                        className="text-sm uppercase mb-2 tracking-wider font-heading"
                        style={{
                          color: theme.textMuted,
                        }}
                      >
                        Chat Invites ({chatRequests.length})
                    </Text>
                    {chatRequests.map((request) => (
                      <View
                        key={request.id}
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
                        <View className="p-4">
                          <View className="flex-row items-center justify-between">
                            <View>
                              <Text
                                className="text-sm"
                                style={{
                                  fontFamily: "Inter-SemiBold",
                                  color: theme.text,
                                }}
                              >
                                Friend
                              </Text>
                              <Text
                                className="text-[11px]"
                                style={{
                                  fontFamily: "Inter-Medium",
                                  color: theme.textMuted,
                                }}
                              >
                                Wants to chat
                              </Text>
                            </View>
                            <View className="flex-row gap-2">
                              <TouchableOpacity
                                onPress={async () => {
                                  try {
                                    await dispatch(
                                      respondToChatRequestThunk({
                                        requestId: request.id,
                                      }),
                                    ).unwrap();
                                    Alert.alert("Accepted", "Chat opened");
                                  } catch (err) {
                                    Alert.alert("Error", err);
                                  }
                                }}
                                className="px-4 py-2 rounded-xl"
                                style={{ backgroundColor: theme.brand }}
                              >
                                <Text
                                  className="text-white text-[10px] uppercase tracking-wider"
                                  style={{ fontFamily: "Inter-Bold" }}
                                >
                                  Accept
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={async () => {
                                  try {
                                    await dispatch(
                                      respondToChatRequestThunk({
                                        requestId: request.id,
                                      }),
                                    ).unwrap();
                                    Alert.alert(
                                      "Declined",
                                      "Chat request declined",
                                    );
                                  } catch (err) {
                                    Alert.alert("Error", err);
                                  }
                                }}
                                className="px-4 py-2 rounded-xl"
                                style={{ backgroundColor: theme.surface }}
                              >
                                <Text
                                  className="text-[10px] uppercase tracking-wider"
                                  style={{
                                    fontFamily: "Inter-Bold",
                                    color: theme.textMuted,
                                  }}
                                >
                                  Decline
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {pendingFriendEventInvites &&
                  pendingFriendEventInvites.length > 0 && (
                    <View className="mb-4 px-2">
                      <Text
                        className="text-sm uppercase mb-2 tracking-wider font-heading"
                        style={{
                          color: theme.textMuted,
                        }}
                      >
                        Event Invites ({pendingFriendEventInvites.length})
                      </Text>
                      {pendingFriendEventInvites.map((invite) => {
                        const event = invite.events;
                        if (!event) return null;
                        const eventDate = new Date(event.start_time);
                        const formattedDate = eventDate.toLocaleDateString(
                          "en-US",
                          { weekday: "short", month: "short", day: "numeric" },
                        );
                        return (
                          <View
                            key={invite.id}
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
                            <View className="p-4">
                              <View className="flex-row items-start">
                                <View
                                  className="w-10 h-10 rounded-xl items-center justify-center"
                                  style={{ backgroundColor: theme.brandLight }}
                                >
                                  <Ionicons
                                    name="calendar"
                                    size={18}
                                    color={theme.brand}
                                  />
                                </View>
                                <View className="ml-3 flex-1">
                                  <Text
                                    className="text-sm"
                                    style={{
                                      fontFamily: "Inter-SemiBold",
                                      color: theme.text,
                                    }}
                                  >
                                    {event.title}
                                  </Text>
                                  <Text
                                    className="text-[11px] mt-0.5"
                                    style={{
                                      fontFamily: "Inter-Medium",
                                      color: theme.textMuted,
                                    }}
                                  >
                                    {formattedDate} {event.location_name}
                                  </Text>
                                </View>
                              </View>
                              <View className="flex-row mt-3 gap-2">
                                <TouchableOpacity
                                  onPress={async () => {
                                    try {
                                      await dispatch(
                                        respondToFriendEventInviteThunk({
                                          userId,
                                          eventId: event.id,
                                          status: "committed",
                                        }),
                                      ).unwrap();
                                      await dispatch(
                                        fetchPendingEventInvites(userId),
                                      );
                                      await dispatch(
                                        fetchCommittedFriendEvents(userId),
                                      );
                                      Alert.alert(
                                        "Accepted!",
                                        "You're going to this event.",
                                      );
                                    } catch (err) {
                                      Alert.alert("Error", err);
                                    }
                                  }}
                                  className="px-4 py-2 rounded-xl"
                                  style={{ backgroundColor: theme.brand }}
                                >
                                  <Text
                                    className="text-white text-[10px] uppercase tracking-wider"
                                    style={{ fontFamily: "Inter-Bold" }}
                                  >
                                    Going
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={async () => {
                                    try {
                                      await dispatch(
                                        respondToFriendEventInviteThunk({
                                          userId,
                                          eventId: event.id,
                                          status: "declined",
                                        }),
                                      ).unwrap();
                                      await dispatch(
                                        fetchPendingEventInvites(userId),
                                      );
                                      Alert.alert(
                                        "Declined",
                                        "You won't attend this event.",
                                      );
                                    } catch (err) {
                                      Alert.alert("Error", err);
                                    }
                                  }}
                                  className="px-4 py-2 rounded-xl"
                                  style={{ backgroundColor: theme.surface }}
                                >
                                  <Text
                                    className="text-[10px] uppercase tracking-wider"
                                    style={{
                                      fontFamily: "Inter-Bold",
                                      color: theme.textMuted,
                                    }}
                                  >
                                    Decline
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                {(!pendingRequests || pendingRequests.length === 0) &&
                  (!sentRequests || sentRequests.length === 0) &&
                  (!chatRequests || chatRequests.length === 0) &&
                  (!pendingFriendEventInvites ||
                    pendingFriendEventInvites.length === 0) && (
                    <View className="py-8 items-center">
                      <Text
                        className="text-sm"
                        style={{
                          fontFamily: "Inter-Medium",
                          color: theme.textMuted,
                        }}
                      >
                        No invites or requests at the moment.
                      </Text>
                    </View>
                  )}

                <TouchableOpacity
                  onPress={() => setInvitesModalVisible(false)}
                  className="mt-4 items-center pb-4"
                >
                  <Text
                    className="text-[11px] uppercase tracking-widest"
                    style={{
                      fontFamily: "Inter-SemiBold",
                      color: theme.textMuted,
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}
