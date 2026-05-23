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
import { checkUserSession, signUpUser } from "../store/authSlice";

export default function SignUpScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const finalFullName = name;
    const finalUsername = finalFullName;
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        signUpUser({
          email,
          password,
          username: finalUsername,
          fullName: finalFullName,
        }),
      ).unwrap();
      if (result?.session) {
        await dispatch(checkUserSession()).unwrap();
        router.replace("/intrestsOnboarding");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    Alert.alert("Coming Soon", "Google authentication will be available soon.");
  };

  return (
    <GradientBackground isDark={isDark} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 70 }}
          className="px-6 pt-24"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10">
            <Text
              className="text-2xl tracking-wide"
              style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
            >
              Create an account for
            </Text>
            <Text
              className="text-5xl mt-1 uppercase tracking-tighter font-heading"
              style={{ color: theme.brand }}
            >
              SYNQ
            </Text>
          </View>

          <View className="gap-y-5 mb-12">
            <View>
              <Text
                className="text-sm mb-2 uppercase tracking-wider"
                style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
              >
                Full Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your Full Name"
                placeholderTextColor={theme.placeholder}
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
            <View>
              <Text
                className="text-sm mb-2 uppercase tracking-wider"
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
            <View>
              <Text
                className="text-sm mb-2 uppercase tracking-wider"
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
            </View>
            <View>
              <Text
                className="text-sm mb-2 uppercase tracking-wider"
                style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
              >
                Confirm Password
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
            </View>
          </View>

          <View className="gap-y-4 mb-10">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSignup}
              disabled={!email || !password || !name || loading}
              className="py-4 items-center"
              style={{
                borderRadius: theme.elementRadius,
                backgroundColor:
                  email && password && name && !loading
                    ? theme.brand
                    : theme.border,
              }}
            >
              <Text
                className="text-base uppercase tracking-wider font-heading"
                style={{
                  color:
                    email && password && name && !loading
                      ? "#FFF"
                      : theme.textMuted,
                }}
              >
                {loading ? "Loading..." : "Next"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoogleSignup}
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
                Sign up with Google
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text
                className="text-sm"
                style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
              >
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text
                  className="text-sm uppercase tracking-wider font-heading"
                  style={{ color: theme.brand }}
                >
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
