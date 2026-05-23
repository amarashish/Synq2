import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import * as Location from "expo-location";
import { Colors } from "../constants/Colors";
import GradientBackground from "../components/GradientBackground";
import {
  fetchNearbyTribes,
  joinMultipleTribes,
  fetchJoinedTribes,
} from "../store/tribeSlice";

export default function WelcomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [selectedTribeIds, setSelectedTribeIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const availableTribes = useSelector((state) => state.tribe.availableTribes);
  const userId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    const loadTribes = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          dispatch(fetchNearbyTribes({ lat: 0, lng: 0 }));
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        dispatch(
          fetchNearbyTribes({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          }),
        );
      } catch (err) {
        console.error("Location error:", err);
        dispatch(fetchNearbyTribes({ lat: 0, lng: 0 }));
      }
    };
    loadTribes();
  }, [dispatch]);

  const toggleTribeSelection = (tribeId) => {
    setSelectedTribeIds((prev) =>
      prev.includes(tribeId)
        ? prev.filter((id) => id !== tribeId)
        : [...prev, tribeId],
    );
  };

  const handleContinue = async () => {
    if (selectedTribeIds.length === 0) {
      Alert.alert(
        "Select Tribes",
        "Please select at least one tribe to continue.",
      );
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User profile not loaded. Please try again.");
      return;
    }
    setLoading(true);
    try {
      await dispatch(
        joinMultipleTribes({ userId, tribeIds: selectedTribeIds }),
      );
      await dispatch(fetchJoinedTribes(userId));
      router.replace("/(tabs)/synq");
    } catch (err) {
      Alert.alert("Error", "Failed to join tribes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground
      isDark={isDark}
      style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 80 }}
    >
      <View className="mb-10">
        <Text
          className="text-4xl tracking-wide font-heading"
          style={{ color: theme.text }}
        >
          Welcome to
        </Text>
        <Text
          className="text-5xl mt-1 uppercase tracking-tighter font-heading"
          style={{ color: theme.brand }}
        >
          SYNQ
        </Text>
        <Text
          className="text-sm mt-4 leading-6"
          style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
        >
          Pick your vibes. We'll curate your feed based on what you love.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="flex-row flex-wrap gap-3">
          {availableTribes && availableTribes.length > 0 ? (
            availableTribes.map((tribe) => {
              const isSelected = selectedTribeIds.includes(tribe.id);
              return (
                <TouchableOpacity
                  key={tribe.id}
                  activeOpacity={0.7}
                  onPress={() => toggleTribeSelection(tribe.id)}
                  className="px-5 py-3"
                  style={{
                    borderRadius: theme.pillRadius,
                    backgroundColor: isSelected ? theme.brand : theme.surface,
                    borderWidth: 1.5,
                    borderColor: isSelected ? theme.brand : theme.borderLight,
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      fontFamily: isSelected ? "Inter-Bold" : "Inter-Medium",
                      color: isSelected ? "#FFF" : theme.textMuted,
                    }}
                  >
                    {tribe.name}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text
              className="text-sm"
              style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
            >
              Loading tribes...
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={selectedTribeIds.length === 0 || loading}
          className="py-4 items-center"
          style={{
            borderRadius: theme.elementRadius,
            backgroundColor:
              selectedTribeIds.length > 0 && !loading
                ? theme.brand
                : theme.border,
            ...Platform.select({
              ios: {
                shadowColor:
                  selectedTribeIds.length > 0 ? theme.shadow : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: selectedTribeIds.length > 0 ? 1 : 0,
                shadowRadius: 8,
              },
              android: { elevation: selectedTribeIds.length > 0 ? 6 : 0 },
            }),
          }}
        >
          <Text
            className="text-base uppercase tracking-wider font-heading"
            style={{
              color:
                selectedTribeIds.length > 0 && !loading
                  ? "#FFF"
                  : theme.textMuted,
            }}
          >
            {selectedTribeIds.length > 0
              ? `Continue (${selectedTribeIds.length})`
              : "Select at least one"}
          </Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}
