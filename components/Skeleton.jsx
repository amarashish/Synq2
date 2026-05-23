import { View, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import { Colors } from "../constants/Colors";

export default function Skeleton({ variant = "rect", width, height, isDark }) {
  const theme = Colors[isDark ? "dark" : "light"];
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const baseStyle = {
    backgroundColor: theme.border,
    borderRadius: theme.elementRadius,
  };

  const variants = {
    circle: { width: width || 48, height: height || 48, borderRadius: width || 48 },
    card: { width: width || "100%", height: height || 160 },
    chip: { width: width || 80, height: height || 32, borderRadius: theme.pillRadius },
    button: { width: width || 100, height: height || 44, borderRadius: theme.elementRadius },
    text: { width: width || 120, height: height || 12, borderRadius: 6 },
    rect: { width: width || "100%", height: height || 60 },
  };

  const style = variants[variant] || variants.rect;

  return (
    <Animated.View style={[baseStyle, style, { opacity }]} />
  );
}
