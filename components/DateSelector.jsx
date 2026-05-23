import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Colors } from "../constants/Colors";

export default function DateSelector({ selectedDate, onSelectDate, isDark }) {
  const theme = Colors[isDark ? "dark" : "light"];

  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  });

  return (
    <View className="mb-6">
      <Text
        className="text-[10px] uppercase tracking-widest mb-2 font-heading"
        style={{ color: theme.textMuted }}
      >
        Select Date
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {dates.map((date, index) => {
          const isSelected = selectedDate === index;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onSelectDate(index)}
              className="mr-2 py-2.5 px-4"
              style={{
                borderRadius: theme.elementRadius,
                backgroundColor: isSelected ? theme.brand : theme.bg,
                borderWidth: 1,
                borderColor: theme.borderLight,
              }}
            >
              <Text
                className="text-[11px]"
                style={{
                  fontFamily: isSelected ? "Inter-Bold" : "Inter-Medium",
                  color: isSelected ? "#FFF" : theme.textMuted,
                }}
              >
                {date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
