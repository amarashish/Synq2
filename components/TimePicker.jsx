import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Colors } from "../constants/Colors";

const hours = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, "0"),
);
const minutes = ["00", "15", "30", "45"];

export function TimeSelector({ value, onChange, isDark, label }) {
  const theme = Colors[isDark ? "dark" : "light"];

  return (
    <View className="mb-6">
      <Text
        className="text-[10px] uppercase tracking-widest mb-2 font-heading"
        style={{ color: theme.textMuted }}
      >
        {label}
      </Text>
      <View
        className="p-4"
        style={{
          borderRadius: theme.elementRadius,
          backgroundColor: theme.bg,
          borderWidth: 1,
          borderColor: theme.borderLight,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          {hours.map((h) => (
            <TouchableOpacity
              key={h}
              onPress={() => onChange({ ...value, hr: h })}
              className="mr-2 py-2 px-4"
              style={{
                borderRadius: theme.elementRadius - 2,
                backgroundColor: value.hr === h ? theme.brand : theme.surface,
                borderWidth: 1,
                borderColor: theme.borderLight,
              }}
            >
              <Text
                className="text-[11px]"
                style={{
                  fontFamily: value.hr === h ? "Inter-Bold" : "Inter-Medium",
                  color: value.hr === h ? "#FFF" : theme.textMuted,
                }}
              >
                {h}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View className="flex-row items-center justify-between">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row flex-1 mr-4"
          >
            {minutes.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => onChange({ ...value, min: m })}
                className="mr-2 py-2 px-4"
                style={{
                  borderRadius: theme.elementRadius - 2,
                  backgroundColor:
                    value.min === m ? theme.brand : theme.surface,
                  borderWidth: 1,
                  borderColor: theme.borderLight,
                }}
              >
                <Text
                  className="text-[11px]"
                  style={{
                    fontFamily: value.min === m ? "Inter-Bold" : "Inter-Medium",
                    color: value.min === m ? "#FFF" : theme.textMuted,
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View
            className="flex-row rounded-xl p-0.5"
            style={{ backgroundColor: theme.surface }}
          >
            {["AM", "PM"].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => onChange({ ...value, period: p })}
                className="px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor:
                    value.period === p ? theme.brand : "transparent",
                }}
              >
                <Text
                  className="text-[10px]"
                  style={{
                    fontFamily:
                      value.period === p ? "Inter-ExtraBold" : "Inter-SemiBold",
                    color: value.period === p ? "#FFF" : theme.textMuted,
                  }}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export function isTimeValid(startTime, endTime) {
  let sHr = parseInt(startTime.hr);
  if (startTime.period === "AM" && sHr === 12) sHr = 0;
  if (startTime.period === "PM" && sHr !== 12) sHr += 12;
  let eHr = parseInt(endTime.hr);
  if (endTime.period === "AM" && eHr === 12) eHr = 0;
  if (endTime.period === "PM" && eHr !== 12) eHr += 12;
  return sHr * 60 + parseInt(startTime.min) < eHr * 60 + parseInt(endTime.min);
}
