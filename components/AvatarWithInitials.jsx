import { View, Text } from "react-native";
import { Colors } from "../constants/Colors";

const sizeMap = {
  8: { w: 28, h: 28, textSize: 9 },
  10: { w: 36, h: 36, textSize: 11 },
  12: { w: 44, h: 44, textSize: 14 },
  14: { w: 52, h: 52, textSize: 16 },
};

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AvatarWithInitials({
  name,
  size = 12,
  bgColor,
  textColor,
  isDark,
}) {
  const theme = Colors[isDark ? "dark" : "light"];
  const dimensions = sizeMap[size] || sizeMap[12];
  const initials = getInitials(name);

  return (
    <View
      className="items-center justify-center"
      style={{
        width: dimensions.w,
        height: dimensions.h,
        borderRadius: dimensions.w / 3,
        backgroundColor: bgColor || theme.brandLight,
      }}
    >
      <Text
        style={{
          fontSize: dimensions.textSize,
          fontFamily: "Inter-Bold",
          color: textColor || theme.brand,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
