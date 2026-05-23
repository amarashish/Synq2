import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Keyboard,
  Animated,
  Alert,
  BackHandler,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import GradientBackground from "../components/GradientBackground";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import {
  clearMessages,
  fetchTribeMessages,
  subscribeToMessages,
  createMessage,
} from "../store/chatSlice";
import { fetchDailySparkForTribe } from "../store/sparkSlice";
import { addTribeInvite } from "../store/userSlice";
import { createEvent } from "../lib/api/events";
import CreatePlanModal from "../components/CreatePlanModal";
import { fetchEvents } from "../store/eventSlice";

export default function TribeChatScreen() {
  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const dispatch = useDispatch();
  const scrollViewRef = useRef(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    tribeId,
    tribeName,
    isUnlocked: isUnlockedParam,
  } = useLocalSearchParams();

  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const userId = useSelector((state) => state.auth.user?.id);
  const user = useSelector((state) => state.auth.user);
  const messages = useSelector((state) => state.chat.messages);
  const joinedTribes = useSelector((state) => state.tribe.joinedTribes);
  const sparkByTribe =
    useSelector((state) => state.spark.dailySparkByTribe) || {};
  const dailySpark = sparkByTribe[tribeId] || {};

  const displayTribeName =
    tribeName || joinedTribes?.find((t) => t.id === tribeId)?.name || "TRIBE";

  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isLocked, setIsLocked] = useState(true);
  const previousTribeIdRef = useRef(null);

  useEffect(() => {
    if (previousTribeIdRef.current !== tribeId) {
      previousTribeIdRef.current = tribeId;
      setIsLocked(true);
    }
  }, [tribeId]);

  const [isPlanModalVisible, setPlanModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventLat, setEventLat] = useState(null);
  const [eventLng, setEventLng] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState({
    hr: "10",
    min: "00",
    period: "AM",
  });
  const [endTime, setEndTime] = useState({ hr: "05", min: "00", period: "PM" });

  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("[TRIBE-CHAT]: Location permission denied");
      }
    })();
  }, []);

  useEffect(() => {
    if (tribeId) {
      dispatch(fetchDailySparkForTribe(tribeId));
    }
  }, [tribeId]);

  useEffect(() => {
    const hasAnsweredByCheck = dailySpark?.answered_by?.includes(userId);

    if (isUnlockedParam === "true" || hasAnsweredByCheck) {
      setIsLocked(false);
      return;
    }

    if (!dailySpark?.id) {
      setIsLocked(true);
      return;
    }

    setIsLocked(true);
  }, [dailySpark, userId, isUnlockedParam]);

  useEffect(() => {
    if (!tribeId) return;
    dispatch(clearMessages());
    dispatch(fetchTribeMessages(tribeId));
    const subscription = subscribeToMessages(dispatch, tribeId, null);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 300);

    return () => {
      dispatch(clearMessages());
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [tribeId]);

  useEffect(() => {
    const normalized = (messages || []).map((msg) => {
      const isSent = msg?.sender_id === userId;
      return {
        id: msg?.id || `${Date.now()}-${Math.random()}`,
        sender: isSent ? "YOU" : msg?.sender_name || "USER",
        text: msg?.content || msg?.text || "",
        type: msg?.type || (isSent ? "sent" : "received"),
      };
    });
    setChatMessages(normalized);
  }, [messages, userId]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [chatMessages.length]);

  const handleSendMessage = async () => {
    if (!message.trim() || !userId || !tribeId) return;
    try {
      await dispatch(
        createMessage({
          tribeId,
          receiverId: null,
          userId,
          content: message,
          username: user.username,
        }),
      ).unwrap();
      setMessage("");
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      Alert.alert("Error", "Failed to send message.");
    }
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const keyboardDidShowListener = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardHeight, {
        duration: Platform.OS === "ios" ? 250 : 150,
        toValue: e.endCoordinates.height,
        useNativeDriver: false,
      }).start(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    });
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardHeight, {
        duration: Platform.OS === "ios" ? 250 : 150,
        toValue: 0,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isPlanModalVisible) {
          setPlanModalVisible(false);
          return true;
        }
        return false;
      },
    );
    return () => backHandler.remove();
  }, [isPlanModalVisible]);

  const isTimeValid = () => {
    let sHr = parseInt(startTime.hr);
    if (startTime.period === "AM" && sHr === 12) sHr = 0;
    if (startTime.period === "PM" && sHr !== 12) sHr += 12;
    let eHr = parseInt(endTime.hr);
    if (endTime.period === "AM" && eHr === 12) eHr = 0;
    if (endTime.period === "PM" && eHr !== 12) eHr += 12;
    return (
      sHr * 60 + parseInt(startTime.min) < eHr * 60 + parseInt(endTime.min)
    );
  };

  const handleCreatePlan = async () => {
    if (!isTimeValid()) {
      Alert.alert("Invalid Time", "Start time must be before the End time!");
      return;
    }

    const dateString = selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeString = `${dateString} | ${startTime.hr}:${startTime.min} ${startTime.period} - ${endTime.hr}:${endTime.min} ${endTime.period}`;

    let sHrForStamp = parseInt(startTime.hr);
    if (startTime.period === "AM" && sHrForStamp === 12) sHrForStamp = 0;
    if (startTime.period === "PM" && sHrForStamp !== 12) sHrForStamp += 12;
    const exactStartTimestamp = new Date(selectedDate);
    exactStartTimestamp.setHours(sHrForStamp, parseInt(startTime.min), 0, 0);

    let eHrForStamp = parseInt(endTime.hr);
    if (endTime.period === "AM" && eHrForStamp === 12) eHrForStamp = 0;
    if (endTime.period === "PM" && eHrForStamp !== 12) eHrForStamp += 12;
    const exactEndTimestamp = new Date(selectedDate);
    exactEndTimestamp.setHours(eHrForStamp, parseInt(endTime.min), 0, 0);

    const eventTribe = displayTribeName || "GENERAL";
    const eventPayload = {
      title: eventTitle.toUpperCase(),
      description: `Tribe event for ${eventTribe}`,
      start_time: exactStartTimestamp.toISOString(),
      end_time: exactEndTimestamp.toISOString(),
      event_type: "TRIBE_EVENT",
      tribe_id: tribeId,
      creator_id: userId,
      karma_cost: 5,
      location_name: eventLocation.trim(),
      lat: eventLat,
      lng: eventLng,
    };

    const { data: dbEvent, error } = await createEvent(eventPayload);
    if (error) {
      Alert.alert("Error", "Failed to create event in database.");
      return;
    }

    dispatch(
      addTribeInvite({
        id: dbEvent?.id || Date.now().toString(),
        title: eventTitle.toUpperCase(),
        time: timeString,
        location: eventLocation.trim(),
        lat: eventLat,
        lng: eventLng,
        karma: 5,
        tribe: eventTribe,
        timestamp: exactStartTimestamp.getTime(),
        tribe_id: tribeId,
      }),
    );

    dispatch(fetchEvents());

    setChatMessages([
      ...chatMessages,
      {
        id: Date.now().toString(),
        sender: "SYSTEM",
        text: `BROADCASTED TO [${eventTribe}]:\n${eventTitle}\n${eventLocation}\n${timeString}`,
        type: "invite",
      },
    ]);
    setPlanModalVisible(false);
    setEventTitle("");
    setEventLocation("");
    setEventLat(null);
    setEventLng(null);
  };

  const selectedDateIndex = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);
    return diff >= 0 && diff < 14 ? diff : 0;
  })();

  const handleDateSelect = (index) => {
    const d = new Date();
    d.setDate(d.getDate() + index);
    setSelectedDate(d);
  };

  if (isLocked) {
    return (
      <GradientBackground isDark={isDark} style={{ paddingTop: insets.top }}>
        <View className="px-6 mb-4 mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.replace("/tribes")}
              className="mr-3 p-1"
            >
              <Ionicons name="arrow-back" size={26} color={theme.brand} />
            </TouchableOpacity>
            <Text
              className="text-3xl uppercase tracking-tighter font-heading"
              style={{ color: theme.brand }}
            >
              {displayTribeName}
            </Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-24 h-24 rounded-2xl items-center justify-center mb-6"
            style={{
              backgroundColor: theme.surface,
              borderWidth: 2,
              borderColor: theme.brandLight,
            }}
          >
            <Ionicons name="lock-closed" size={44} color={theme.brand} />
          </View>
          <Text
            className="text-2xl uppercase tracking-tighter mb-3 font-heading"
            style={{ color: theme.text }}
          >
            Chat Locked
          </Text>
          <Text
            className="text-sm text-center mb-8"
            style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
          >
            Answer today's spark to unlock this chat
          </Text>
          {dailySpark?.question && (
            <View
              className="w-full p-6 overflow-hidden"
              style={{
                borderRadius: theme.cardRadius,
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
              <View style={{ height: 3, backgroundColor: theme.brand }} />
              <View className="pt-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="flash" size={14} color={theme.brand} />
                  <Text
                    className="text-[10px] ml-2 uppercase tracking-wider font-heading"
                    style={{ color: theme.brand }}
                  >
                    {displayTribeName} Spark
                  </Text>
                </View>
                <Text
                  className="text-base italic"
                  style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
                >
                  "{dailySpark.question}"
                </Text>
              </View>
            </View>
          )}
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground isDark={isDark} style={{ paddingTop: insets.top }}>
      <View className="flex-1">
        <View className="px-6 mb-4 mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.replace("/tribes")}
              className="mr-3 p-1"
            >
              <Ionicons name="arrow-back" size={26} color={theme.brand} />
            </TouchableOpacity>
            <Text
              className="text-3xl uppercase tracking-tighter font-heading"
              style={{ color: theme.brand }}
            >
              {displayTribeName}
            </Text>
          </View>
        </View>
        
        <View className="px-4">
          <View
            className="p-4 mb-4"
            style={{
              borderRadius: theme.elementRadius,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.borderLight,
            }}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="flash" size={12} color={theme.brand} />
              <Text
                className="text-[10px] ml-1 uppercase tracking-wider font-heading"
                style={{ color: theme.brand }}
              >
                {displayTribeName} Spark
              </Text>
            </View>
            <Text
              className="text-[10px] mb-1"
              style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
            >
              RE: TODAY'S SPARK
            </Text>
            <Text
              className="text-xs italic"
              style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
            >
              "{dailySpark?.question || "What's on your mind?"}"
            </Text>
          </View>
        </View>

        <ScrollView
          ref={(ref) => {
            scrollViewRef.current = ref;
          }}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-end",
            paddingBottom: 10,
          }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            setTimeout(() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: false });
              }
            }, 150);
          }}
        >
          {chatMessages.map((msg) => (
            <View
              key={msg.id}
              className={`p-4 mb-4 max-w-[80%] ${msg.type === "sent" ? "self-end" : msg.type === "invite" ? "self-center max-w-[95%] items-center" : "self-start"}`}
              style={{
                borderRadius: theme.elementRadius,
                backgroundColor:
                  msg.type === "sent"
                    ? theme.brandLight
                    : msg.type === "invite"
                      ? theme.surface
                      : theme.surface,
                borderWidth: msg.type === "invite" ? 1 : 1,
                borderColor:
                  msg.type === "invite"
                    ? theme.accentGold + "40"
                    : theme.borderLight,
                borderTopRightRadius:
                  msg.type === "sent" ? 4 : theme.elementRadius,
                borderTopLeftRadius:
                  msg.type === "sent" ? theme.elementRadius : 4,
              }}
            >
              {msg.type !== "invite" && (
                <Text
                  className="text-[10px] mb-1 uppercase tracking-wider"
                  style={{ fontFamily: "Inter-Bold", color: theme.brand }}
                >
                  {msg.sender}
                </Text>
              )}
              <Text
                className="text-sm"
                style={{
                  fontFamily: "Inter-Medium",
                  color: msg.type === "sent" ? theme.text : theme.text,
                }}
              >
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View
          style={{
            paddingTop: 12,
            paddingBottom: 20,
            backgroundColor: theme.bg,
            borderTopWidth: 1,
            borderTopColor: theme.borderLight,
          }}
          className="px-4"
        >
          <View className="flex-row items-center gap-2">
            <View
              className="flex-1 flex-row items-center px-4"
              style={{
                borderRadius: theme.pillRadius,
                backgroundColor: theme.inputBg,
                borderWidth: 1,
                borderColor: theme.borderLight,
              }}
            >
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Message..."
                placeholderTextColor={theme.placeholder}
                style={{
                  height: 45,
                  fontFamily: "Inter-Medium",
                  color: theme.text,
                  flex: 1,
                }}
              />
              <TouchableOpacity onPress={handleSendMessage}>
                <Ionicons
                  name="arrow-up-circle"
                  size={32}
                  color={message.trim() ? theme.brand : theme.textMuted}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setPlanModalVisible(true)}
              className="w-11 h-11 rounded-xl items-center justify-center"
              style={{ backgroundColor: theme.brand }}
            >
              <Ionicons name="calendar" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Animated.View
        style={{
          height:
            Platform.OS === "ios"
              ? Animated.subtract(
                  keyboardHeight,
                  keyboardHeight.interpolate({
                    inputRange: [0, 100],
                    outputRange: [-insets.bottom, 0],
                    extrapolate: "clamp",
                  }),
                )
              : keyboardHeight,
        }}
      />

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
        selectedDate={selectedDateIndex}
        setSelectedDate={handleDateSelect}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        selectedFriends={[]}
        toggleFriendSelection={() => {}}
        innerCircle={false}
        innerCircleProfiles={[]}
        userId={userId}
        onSubmit={handleCreatePlan}
        isDark={isDark}
        requireFriends={false}
      />
    </GradientBackground>
  );
}
