import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ModernTabSelector({
  tabs,
  activeTab,
  onTabChange,
  isDark,
}) {
  const theme = Colors[isDark ? "dark" : "light"];

  const handleTabPress = (tabKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onTabChange(tabKey);
  };

  return (
    <View
      className="flex-row p-1 mb-5"
      style={{ borderRadius: theme.pillRadius, backgroundColor: theme.surface }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            className="flex-1 flex-row items-center justify-center py-2.5 px-3"
            style={{
              borderRadius: theme.pillRadius - 2,
              backgroundColor: isActive ? theme.brand : "transparent",
              shadowColor: isActive ? theme.shadow : "transparent",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isActive ? 1 : 0,
              shadowRadius: 6,
              elevation: isActive ? 4 : 0,
            }}
          >
            {tab.icon && (
              <Ionicons
                name={tab.icon}
                size={14}
                color={isActive ? "#FFF" : theme.textMuted}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              className="text-[10px] uppercase tracking-wider font-heading"
              style={{
                color: isActive ? "#FFF" : theme.textMuted,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
