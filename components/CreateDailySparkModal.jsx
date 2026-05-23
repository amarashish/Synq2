import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { createDailySparkForTribe } from "../store/sparkSlice";

export default function CreateDailySparkModal({
  visible,
  onClose,
  tribes,
  isDark,
}) {
  const dispatch = useDispatch();
  const theme = Colors[isDark ? "dark" : "light"];
  const [selectedTribeId, setSelectedTribeId] = useState(null);
  const [question, setQuestion] = useState("");

  const handleClose = () => {
    setSelectedTribeId(null);
    setQuestion("");
    onClose();
  };

  const handleCreate = async () => {
    if (!selectedTribeId || !question.trim()) return;
    try {
      await dispatch(
        createDailySparkForTribe({
          tribeId: selectedTribeId,
          question: question.trim(),
        }),
      ).unwrap();
      Alert.alert("Success!", "Daily spark created for today.");
      handleClose();
    } catch (err) {
      Alert.alert("Error", err || "Failed to create spark. Try again.");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: theme.overlay }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="p-6 pb-10"
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
            }}
          >
            <View
              className="w-10 h-1 rounded-full self-center mb-6"
              style={{ backgroundColor: theme.borderLight }}
            />

            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl uppercase tracking-tighter font-heading"
                style={{ color: theme.text }}
              >
                Create Daily Spark
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text
              className="text-xs uppercase tracking-wider mb-2"
              style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
            >
              Select Tribe
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
            >
              {tribes.map((tribe) => {
                const isSelected = selectedTribeId === tribe.id;
                return (
                  <TouchableOpacity
                    key={tribe.id}
                    className="mr-2 px-4 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: isSelected
                        ? theme.brand
                        : theme.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.brand : theme.borderLight,
                    }}
                    onPress={() => setSelectedTribeId(tribe.id)}
                  >
                    <Text
                      className="text-xs uppercase tracking-wider"
                      style={{
                        fontFamily: "Inter-Bold",
                        color: isSelected ? "white" : theme.text,
                      }}
                    >
                      {tribe.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text
              className="text-xs uppercase tracking-wider mb-2"
              style={{ fontFamily: "Inter-Bold", color: theme.textMuted }}
            >
              Question
            </Text>
            <TextInput
              className="p-4 rounded-xl mb-6"
              style={{
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: theme.borderLight,
                color: theme.text,
                fontFamily: "Inter-Medium",
                fontSize: 14,
              }}
              placeholder="What's your spark question?"
              placeholderTextColor={theme.textMuted}
              value={question}
              onChangeText={setQuestion}
              multiline
            />

            <TouchableOpacity
              className="py-4 rounded-xl items-center"
              style={{
                backgroundColor:
                  selectedTribeId && question.trim()
                    ? theme.brand
                    : theme.borderLight,
              }}
              disabled={!selectedTribeId || !question.trim()}
              onPress={handleCreate}
            >
              <Text className="text-white text-base uppercase tracking-wider font-heading">
                Create Spark
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
