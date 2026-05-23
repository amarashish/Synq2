import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

export default function GradientBackground({ children, isDark, style }) {
  if (isDark) {
    return (
      <View style={[{ flex: 1, backgroundColor: "#0F1923" }, style]}>
        <LinearGradient
          colors={["rgba(139,34,82,0.12)", "rgba(15,25,35,0.95)", "#0F1923"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={["rgba(201,149,107,0.06)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: "#F5F0E8" }, style]}>
      {children}
    </View>
  );
}
