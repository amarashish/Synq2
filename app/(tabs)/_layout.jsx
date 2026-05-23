import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { Platform, View } from "react-native";
import { Colors } from "../../constants/Colors";

export default function TabLayout() {
  const themeMode = useSelector((state) => state.theme.mode) || "light";
  const isDark = themeMode === "dark";
  const theme = Colors[themeMode];

  const CapsuleTabBar = () => (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 32,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.borderLight,
        ...Platform.select({
          ios: {
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 16,
          },
          android: {
            elevation: 8,
          },
        }),
      }}
    />
  );

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarBackground: () => <CapsuleTabBar />,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 12,
        },
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontFamily: "Poppins-Bold",
          fontSize: 10,
          textTransform: "uppercase",
          marginTop: 2,
          letterSpacing: 0.8,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "synq") {
            iconName = focused ? "flash" : "flash-outline";
          } else if (route.name === "tribes") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "innerCircle") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="synq" options={{ tabBarLabel: "SYNQ" }} />
      <Tabs.Screen name="tribes" options={{ tabBarLabel: "TRIBES" }} />
      <Tabs.Screen name="innerCircle" options={{ tabBarLabel: "CIRCLE" }} />
    </Tabs>
  );
}
