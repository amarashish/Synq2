import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AntDesign } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import GradientBackground from "../components/GradientBackground";
import { checkUserSession, signInUser } from "../store/authSlice";
import { fetchJoinedTribes } from "../store/tribeSlice";
import { fetchAllSparksForJoinedTribes } from "../store/sparkSlice";
import { fetchEvents, fetchLiveStories } from "../store/eventSlice";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await dispatch(signInUser({ email, password })).unwrap();
      if (result?.session) {
        const authPayload = await dispatch(checkUserSession()).unwrap();
        const userId = authPayload?.profile?.id;
        if (userId) {
          const joined = await dispatch(fetchJoinedTribes(userId)).unwrap();
          if (Array.isArray(joined) && joined.length > 0) {
            dispatch(fetchAllSparksForJoinedTribes(joined));
          }
          dispatch(fetchEvents());
          dispatch(fetchLiveStories());
        }
        router.replace("/(tabs)/synq");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert("Coming Soon", "Google authentication will be available soon.");
  };

  return (
    <GradientBackground isDark={isDark} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 pt-24"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10">
            <Text
              className="text-2xl tracking-wide"
              style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
            >
              Welcome back to
            </Text>
            <Text
              className="text-6xl mt-1 uppercase tracking-tighter font-heading"
              style={{ color: theme.brand }}
            >
              SYNQ
            </Text>
          </View>

          <View className="mb-6">
            <Text
              className="text-sm mb-2 ml-1 uppercase tracking-wider"
              style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
            >
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              className="px-6 py-4 text-sm"
              style={{
                fontFamily: "Inter-Medium",
                borderRadius: theme.elementRadius,
                backgroundColor: theme.inputBg,
                borderWidth: 1.5,
                borderColor: theme.borderLight,
                color: theme.text,
              }}
            />
          </View>

          <View className="mb-6">
            <Text
              className="text-sm mb-2 ml-1 uppercase tracking-wider"
              style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
            >
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder=""
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              className="px-6 py-4 text-sm"
              style={{
                fontFamily: "Inter-Medium",
                borderRadius: theme.elementRadius,
                backgroundColor: theme.inputBg,
                borderWidth: 1.5,
                borderColor: theme.borderLight,
                color: theme.text,
              }}
            />
            <TouchableOpacity className="self-end mt-2">
              <Text
                className="text-xs uppercase tracking-wider"
                style={{ fontFamily: "Inter-Bold", color: theme.brand }}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-10 mb-10 gap-y-4">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={!email || !password || loading}
              className="py-4 items-center"
              style={{
                borderRadius: theme.elementRadius,
                backgroundColor:
                  email && password && !loading ? theme.brand : theme.border,
              }}
            >
              <Text
                className="text-base uppercase tracking-wider font-heading"
                style={{
                  color:
                    email && password && !loading ? "#FFF" : theme.textMuted,
                }}
              >
                {loading ? "Loading..." : "Log In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoogleLogin}
              className="py-4 items-center flex-row justify-center"
              style={{
                borderRadius: theme.elementRadius,
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: theme.borderLight,
              }}
            >
              <AntDesign name="google" size={18} color={theme.text} />
              <Text
                className="text-sm ml-3 uppercase tracking-wider"
                style={{ fontFamily: "Inter-Bold", color: theme.text }}
              >
                Continue with Google
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
              <Text
                className="text-sm"
                style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
              >
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/signUp")}>
                <Text
                  className="text-sm uppercase tracking-wider font-heading"
                  style={{ color: theme.brand }}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
