import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { checkUserSession } from "../store/authSlice";
import { refreshEventStatus } from "../store/userSlice";
import { fetchJoinedTribes } from "../store/tribeSlice";
import { fetchAllSparksForJoinedTribes } from "../store/sparkSlice";
import { fetchEvents, fetchLiveStories } from "../store/eventSlice";
import { registerPushToken, configurePushNotifications } from "../lib/pushNotifications";

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(refreshEventStatus());
  }, []);

  const strikeWidth = useRef(new Animated.Value(0)).current;
  const mediaOpacity = useRef(new Animated.Value(1)).current;
  const mediaWidth = useRef(new Animated.Value(70)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const titleTracking = useRef(new Animated.Value(-5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(titleTracking, { toValue: 4, duration: 1200, useNativeDriver: false }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(400),
      Animated.timing(strikeWidth, { toValue: 1, duration: 350, useNativeDriver: false }),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(mediaOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(mediaWidth, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start(async () => {
      try {
        const authPayload = await dispatch(checkUserSession()).unwrap();
        const userId = authPayload?.profile?.id;
        if (!userId) throw new Error("Missing userId after session hydration.");

        configurePushNotifications();
        registerPushToken(userId).catch(() => {});

        const joinedResult = await dispatch(fetchJoinedTribes(userId)).unwrap();
        if (Array.isArray(joinedResult) && joinedResult.length > 0) {
          await dispatch(fetchAllSparksForJoinedTribes(joinedResult));
        }
        dispatch(fetchEvents());
        dispatch(fetchLiveStories());

        setTimeout(() => { router.replace("/(tabs)/synq"); }, 1500);
      } catch (err) {
        setTimeout(() => { router.replace("/login"); }, 1500);
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1923" />

      <View style={styles.centerBox}>
        <Animated.Text style={[styles.mainTitle, { opacity: titleOpacity, letterSpacing: titleTracking }]}>
          SYNQ
        </Animated.Text>

        <Animated.View style={[styles.subtitleRow, { opacity: subtitleOpacity }]}>
          <Text style={styles.subtitleText}>THE SOCIAL </Text>
          <Animated.View style={[styles.mediaWrapper, { opacity: mediaOpacity, width: mediaWidth }]}>
            <Text style={styles.mediaText}>MEDIA</Text>
            <View style={styles.strikeContainer}>
              <Animated.View style={[styles.strikeLine, { width: strikeWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
            </View>
          </Animated.View>
          <Text style={styles.subtitleText}> APP</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineBox, { opacity: taglineOpacity, transform: [{ translateY: taglineOpacity.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
          <Text style={styles.taglineText}>
            LESS MEDIA. <Text style={styles.whiteText}>MORE SOCIAL.</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F1923", alignItems: "center", justifyContent: "center" },
  centerBox: { alignItems: "center" },
  mainTitle: { fontSize: 75, color: "#EDE8DD", fontWeight: "800", marginBottom: 10, textShadowColor: "rgba(139,34,82,0.4)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  subtitleRow: { flexDirection: "row", alignItems: "center", height: 30 },
  subtitleText: { fontSize: 16, color: "#8895A7", fontWeight: "700", letterSpacing: 2 },
  mediaText: { fontSize: 16, color: "#2D3748", fontWeight: "700", letterSpacing: 2 },
  mediaWrapper: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  strikeContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "flex-start" },
  strikeLine: { height: 3, backgroundColor: "#8B2252", borderRadius: 2, shadowColor: "#8B2252", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 8 },
  taglineBox: { marginTop: 50, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#2D3748", width: 250, alignItems: "center" },
  taglineText: { fontSize: 11, color: "#8895A7", fontWeight: "700", letterSpacing: 4, textTransform: "uppercase" },
  whiteText: { color: "#EDE8DD" },
});
