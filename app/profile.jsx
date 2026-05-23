import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { signOut } from "../store/authSlice";
import { toggleTheme } from "../store/themeSlice";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import GradientBackground from "../components/GradientBackground";
import { fetchProfileByUserId } from "../store/profileSlice";

export default function ProfileScreen() {
  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const authUser = useSelector((state) => state.auth.user) || {};
  const profile = useSelector((state) => state.profile.profile) || {};
  const user = profile?.id ? profile : authUser;
  const karmaPoints = useSelector((state) => state.auth.karmaPoints);
  const joinedTribes = useSelector((state) => state.tribe.joinedTribes);

  const router = useRouter();
  const dispatch = useDispatch();

  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      dispatch(fetchProfileByUserId(authUser.id));
    }
  }, [dispatch, authUser?.id]);

  const handleSignOut = async () => {
    Alert.alert("Sign Out?", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await dispatch(signOut());
            router.replace("/login");
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to sign out");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const onToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const myTribes = joinedTribes ? joinedTribes.map((t) => t.name) : [];
  const initials = (user?.username || "U")[0].toUpperCase();

  return (
    <GradientBackground isDark={isDark} style={{ paddingTop: 64 }}>
      <View className="items-center px-6 mb-10">
        <View
          className="w-24 h-24 rounded-2xl items-center justify-center mb-4"
          style={{
            backgroundColor: theme.brandLight,
            ...Platform.select({
              ios: {
                shadowColor: theme.brand,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              },
              android: { elevation: 8 },
            }),
          }}
        >
          <Text
            className="text-4xl font-heading"
            style={{ color: theme.brand }}
          >
            {initials}
          </Text>
        </View>
        <Text
          className="text-3xl uppercase tracking-tight font-heading"
          style={{ color: theme.text }}
        >
          {user?.username || "User"}
        </Text>
        <Text
          className="text-sm mt-1"
          style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
        >
          @{user?.username || "user"}
        </Text>

        <View
          className="mt-5 px-6 py-3 rounded-xl flex-row items-center"
          style={{
            backgroundColor: theme.accentGoldLight,
            borderWidth: 1,
            borderColor: theme.accentGold + "30",
          }}
        >
          <Ionicons name="shield" size={16} color={theme.accentGold} />
          <Text
            className="ml-2 text-sm uppercase tracking-wider font-heading"
            style={{ color: theme.accentGold }}
          >
            {karmaPoints} Karma
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-6"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text
              className="text-base uppercase tracking-tighter font-heading"
              style={{ color: theme.text }}
            >
              My Tribes
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/intrestsOnboarding")}
            >
              <Text
                className="text-[11px] uppercase tracking-wider"
                style={{ fontFamily: "Inter-Bold", color: theme.brand }}
              >
                Change
              </Text>
            </TouchableOpacity>
          </View>
          {myTribes && myTribes.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {myTribes.map((tribeName) => (
                <View
                  key={tribeName}
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                  }}
                >
                  <Text
                    className="text-[11px]"
                    style={{
                      fontFamily: "Inter-SemiBold",
                      color: theme.textMuted,
                    }}
                  >
                    # {tribeName}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text
              className="text-sm"
              style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
            >
              No tribes joined yet
            </Text>
          )}
        </View>

        <View
          className="mb-8 overflow-hidden"
          style={{
            borderRadius: theme.elementRadius,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.borderLight,
          }}
        >
          <TouchableOpacity
            onPress={onToggleTheme}
            className="flex-row items-center justify-between px-5 py-4"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: theme.borderLight,
            }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={18}
                color={theme.brand}
              />
              <Text
                className="text-sm ml-4"
                style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
              >
                {isDark ? "Dark Mode" : "Light Mode"}
              </Text>
            </View>
            <View
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                backgroundColor: isDark ? theme.brand : theme.borderLight,
                padding: 3,
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: "#FFFFFF",
                  alignSelf: isDark ? "flex-end" : "flex-start",
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3,
                    },
                    android: {
                      elevation: 4,
                    },
                  }),
                }}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between px-5 py-4"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: theme.borderLight,
            }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="information-circle"
                size={18}
                color={theme.brand}
              />
              <Text
                className="text-sm ml-4"
                style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
              >
                About
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center">
              <Ionicons name="lock-closed" size={18} color={theme.brand} />
              <Text
                className="text-sm ml-4"
                style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
              >
                Privacy Policy
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          disabled={isLoading}
          className="py-4 items-center"
          style={{
            borderRadius: theme.elementRadius,
            backgroundColor: theme.brandLight,
            borderWidth: 1,
            borderColor: theme.brand + "30",
          }}
        >
          <Text
            className="text-sm uppercase tracking-wider font-heading"
            style={{ color: theme.brand }}
          >
            {isLoading ? "Signing Out..." : "Sign Out"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
}
