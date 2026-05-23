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
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import GradientBackground from "../components/GradientBackground";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  clearMessages,
  fetchPrivateMessages,
  createMessage,
  subscribeToMessages,
} from "../store/chatSlice";
import AvatarWithInitials from "../components/AvatarWithInitials";
import {
  getConversationId,
  subscribeToTyping,
  broadcastTyping,
  unsubscribeFromTyping,
  trackOnlinePresence,
  subscribeToFriendPresence,
  untrackOnlinePresence,
} from "../lib/supabaseRealtime";

const TYPING_TIMEOUT = 2000;

export default function PrivateChatScreen() {
  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const dispatch = useDispatch();
  const scrollViewRef = useRef(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { friendId, friendName } = useLocalSearchParams();

  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const userId = useSelector((state) => state.auth.user?.id);
  const user = useSelector((state) => state.auth.user);
  const messages = useSelector((state) => state.chat.messages);

  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isFriendOnline, setIsFriendOnline] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);

  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const typingTimeoutRef = useRef(null);
  const lastTypingBroadcastRef = useRef(0);
  const conversationId = getConversationId(userId, friendId);
  const presenceUnsubRef = useRef(null);

  const displayName = friendName || "Friend";

  useEffect(() => {
    if (!friendId || !userId) return;
    dispatch(clearMessages());
    dispatch(fetchPrivateMessages({ userId, friendId }));
    const msgSubscription = subscribeToMessages(dispatch, null, friendId);

    trackOnlinePresence(userId);

    const presenceSub = subscribeToFriendPresence(friendId, (online) => {
      setIsFriendOnline(online);
    });
    presenceUnsubRef.current = presenceSub;

    subscribeToTyping(conversationId, (payload) => {
      if (payload.userId !== userId) {
        setIsFriendTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsFriendTyping(false);
        }, TYPING_TIMEOUT);
      }
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 300);

    return () => {
      dispatch(clearMessages());
      if (msgSubscription) msgSubscription.unsubscribe();
      if (presenceUnsubRef.current) presenceUnsubRef.current.unsubscribe();
      unsubscribeFromTyping(conversationId);
      untrackOnlinePresence(userId);
    };
  }, [friendId, userId]);

  useEffect(() => {
    const normalized = (messages || []).map((msg) => {
      const isSent = msg?.sender_id === userId;
      return {
        id: msg?.id || `${Date.now()}-${Math.random()}`,
        sender: isSent ? "YOU" : msg?.sender_name || displayName,
        text: msg?.content || msg?.text || "",
        type: isSent ? "sent" : "received",
      };
    });
    setChatMessages(normalized);
  }, [messages, userId, displayName]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [chatMessages.length]);

  const handleSendMessage = async () => {
    if (!message.trim() || !userId || !friendId) return;
    try {
      await dispatch(
        createMessage({
          tribeId: null,
          receiverId: friendId,
          userId,
          content: message,
          username: user?.username,
        }),
      ).unwrap();
      setMessage("");
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      Alert.alert("Error", "Failed to send message.");
    }
  };

  const handleTextChange = (text) => {
    setMessage(text);
    if (!text.trim()) return;
    const now = Date.now();
    if (now - lastTypingBroadcastRef.current > 2000) {
      broadcastTyping(conversationId, userId);
      lastTypingBroadcastRef.current = now;
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

  return (
    <GradientBackground isDark={isDark} style={{ paddingTop: insets.top }}>
      <View className="flex-1">
        <View className="px-6 mb-4 mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-1"
            >
              <Ionicons name="arrow-back" size={26} color={theme.brand} />
            </TouchableOpacity>
            <AvatarWithInitials name={displayName} size={10} isDark={isDark} />
            <View className="ml-2">
              <Text
                className="text-2xl uppercase tracking-tighter font-heading"
                style={{ color: theme.brand }}
              >
                {displayName}
              </Text>
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{
                    backgroundColor: isFriendOnline
                      ? theme.semantic
                      : theme.textMuted,
                  }}
                />
                <Text
                  className="text-[10px] uppercase tracking-wider"
                  style={{
                    fontFamily: "Inter-Bold",
                    color: isFriendOnline ? theme.semantic : theme.textMuted,
                  }}
                >
                  {isFriendOnline ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
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
              className="p-4 mb-4 max-w-[80%]"
              style={{
                borderRadius: theme.elementRadius,
                backgroundColor:
                  msg.type === "sent" ? theme.brandLight : theme.surface,
                borderWidth: 1,
                borderColor: theme.borderLight,
                alignSelf: msg.type === "sent" ? "flex-end" : "flex-start",
                borderTopRightRadius:
                  msg.type === "sent" ? 4 : theme.elementRadius,
                borderTopLeftRadius:
                  msg.type === "sent" ? theme.elementRadius : 4,
              }}
            >
              {msg.type !== "sent" && (
                <Text
                  className="text-[10px] mb-1 uppercase tracking-wider"
                  style={{ fontFamily: "Inter-Bold", color: theme.brand }}
                >
                  {msg.sender}
                </Text>
              )}
              <Text
                className="text-sm"
                style={{ fontFamily: "Inter-Medium", color: theme.text }}
              >
                {msg.text}
              </Text>
            </View>
          ))}

          {isFriendTyping && (
            <View
              className="self-start mb-4 px-5 py-3.5 rounded-2xl border"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.borderLight,
                borderTopLeftRadius: 4,
              }}
            >
              <View className="flex-row items-center gap-1">
                {[0.4, 0.7, 1].map((op, i) => (
                  <View
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: theme.textMuted,
                      opacity: op,
                    }}
                  />
                ))}
              </View>
            </View>
          )}
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
          <View className="flex-row items-center">
            <View
              className="flex-1 rounded-full flex-row items-center px-4"
              style={{
                backgroundColor: theme.inputBg,
                borderWidth: 1,
                borderColor: theme.borderLight,
              }}
            >
              <TextInput
                value={message}
                onChangeText={handleTextChange}
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
    </GradientBackground>
  );
}
