import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

const categoryIcons = {
  music: "musical-notes",
  fitness: "barbell",
  art: "brush",
  gaming: "game-controller",
  tech: "code-slash",
  food: "restaurant",
  travel: "airplane",
  social: "people",
  business: "briefcase",
  wellness: "leaf",
};

const tribeImages = {
  music:
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
  fitness:
    "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&q=80",
  art: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
  gaming:
    "https://images.unsplash.com/photo-1552820728-8b83bb6b1644?w=400&q=80",
  tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  travel:
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80",
  social:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80",
  business:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  wellness:
    "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=80",
};

const defaultImage =
  "https://images.unsplash.com/photo-1518173946687-a36f968f7b8e?w=400&q=80";

export default function MyTribeCard({ tribe, isDark, onPress }) {
  const theme = Colors[isDark ? "dark" : "light"];
  const category = (tribe.category || tribe.name || "").toLowerCase();
  const matchedKey = Object.keys(categoryIcons).find((k) =>
    category.includes(k),
  );
  const icon = matchedKey ? categoryIcons[matchedKey] : "people";
  const isLocked = !tribe.hasAnsweredToday;
  const imageUrl = matchedKey ? tribeImages[matchedKey] : defaultImage;

  const frostColors = isDark
    ? ["rgba(15,25,35,0.85)", "rgba(15,25,35,0.4)", "rgba(15,25,35,0.85)"]
    : [
        "rgba(245,240,232,0.85)",
        "rgba(245,240,232,0.3)",
        "rgba(245,240,232,0.85)",
      ];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mr-3 overflow-hidden rounded-3xl "
      style={{
        width: 130,
        height: 120,
        borderWidth: 1,
        borderColor: theme.borderLight,
      }}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={frostColors}
          locations={[0, 0.5, 1]}
          style={{ flex: 1 }}
        >
          <View
            style={{ flex: 1, padding: 10, justifyContent: "space-between" }}
          >
            <View className="flex-row justify-between items-start">
              <View
                className="w-7 h-7 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: isLocked
                    ? `${theme.textMuted}40`
                    : theme.brandLight,
                }}
              >
                <Ionicons
                  name={isLocked ? "lock-closed" : icon}
                  size={13}
                  color={isLocked ? theme.textMuted : theme.brand}
                />
              </View>
              <View
                className="px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isLocked
                    ? `${theme.textMuted}40`
                    : theme.semanticLight,
                }}
              >
                <Text
                  className="text-[6px] uppercase tracking-wider"
                  style={{
                    fontFamily: "Inter-Black",
                    color: isLocked ? theme.textMuted : theme.semantic,
                  }}
                >
                  {isLocked ? "Lock" : "Open"}
                </Text>
              </View>
            </View>
            <Text
              className="text-[10px] font-black uppercase tracking-tight"
              style={{ color: theme.text }}
              numberOfLines={1}
            >
              {tribe.name}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}
