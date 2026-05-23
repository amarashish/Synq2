import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

export default function SearchBar({
  value,
  onChangeText,
  placeholder,
  isDark,
}) {
  const theme = Colors[isDark ? "dark" : "light"];

  return (
    <View
      className="flex-row items-center px-4 mb-4"
      style={{
        borderRadius: theme.elementRadius,
        backgroundColor: theme.surface,
        height: 48,
        borderWidth: 1,
        borderColor: theme.borderLight,
      }}
    >
      <Ionicons name="search" size={16} color={theme.brand} />
      <TextInput
        className="flex-1 ml-2.5 text-sm"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || "Search..."}
        placeholderTextColor={theme.placeholder}
        style={{ fontFamily: "Inter-Medium", color: theme.text }}
      />
      {value?.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}
