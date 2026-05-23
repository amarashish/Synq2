import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { TimeSelector, isTimeValid } from "./TimePicker";
import DateSelector from "./DateSelector";
import LocationPickerModal from "./LocationPickerModal";

export default function CreatePlanModal({
  visible,
  onClose,
  eventTitle,
  setEventTitle,
  eventLocation,
  setEventLocation,
  eventLat,
  eventLng,
  setEventLat,
  setEventLng,
  selectedDate,
  setSelectedDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  selectedFriends,
  toggleFriendSelection,
  innerCircle,
  innerCircleProfiles,
  userId,
  onSubmit,
  isDark,
  requireFriends = true,
}) {
  const theme = Colors[isDark ? "dark" : "light"];
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);

  const isTitleFilled = eventTitle.trim().length > 0;
  const isLocationFilled = eventLocation.trim().length > 0;
  const timeValid = isTimeValid(startTime, endTime);
  const canSubmit =
    isTitleFilled &&
    isLocationFilled &&
    timeValid &&
    (!requireFriends || selectedFriends.length > 0);

  const handleLocationSelect = ({ lat, lng, name }) => {
    setEventLat(lat);
    setEventLng(lng);
    setEventLocation(name);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
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
                borderTopWidth: 1,
                borderColor: theme.borderLight,
              }}
            >
              <View
                className="w-12 h-1 rounded-full self-center mb-6"
                style={{ backgroundColor: theme.border }}
              />
              <Text
                className="text-xl mb-6 uppercase tracking-tighter font-heading"
                style={{ color: theme.brand }}
              >
                Create New Plan
              </Text>

              <TextInput
                placeholder="What's the plan?"
                placeholderTextColor={theme.placeholder}
                value={eventTitle}
                onChangeText={setEventTitle}
                className="p-4 mb-4 text-sm"
                style={{
                  fontFamily: "Inter-SemiBold",
                  borderRadius: theme.elementRadius,
                  backgroundColor: theme.bg,
                  borderWidth: 1,
                  borderColor: theme.borderLight,
                  color: theme.text,
                }}
              />

              <View className="mb-6">
                <View className="flex-row items-center mb-2">
                  <Text
                    className="text-[10px] uppercase tracking-widest font-heading"
                    style={{
                      color: theme.textMuted,
                    }}
                  >
                    Location
                  </Text>
                  {eventLat && eventLng && (
                    <View
                      className="ml-2 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: theme.semanticLight }}
                    >
                      <Text
                        className="text-[8px] uppercase tracking-wider"
                        style={{
                          fontFamily: "Inter-Bold",
                          color: theme.semantic,
                        }}
                      >
                        Mapped
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  className="flex-row overflow-hidden"
                  style={{
                    borderRadius: theme.elementRadius,
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                  }}
                >
                  <TextInput
                    placeholder="Where? (e.g., CP, Starbucks)"
                    placeholderTextColor={theme.placeholder}
                    value={eventLocation}
                    onChangeText={setEventLocation}
                    className="flex-1 p-4 text-sm"
                    style={{ fontFamily: "Inter-SemiBold", color: theme.text }}
                  />
                  <TouchableOpacity
                    onPress={() => setLocationModalVisible(true)}
                    className="px-4 items-center justify-center"
                    style={{ backgroundColor: theme.brand }}
                  >
                    <Ionicons name="map" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                {eventLat && eventLng && (
                  <Text
                    className="text-[9px] mt-1 ml-1"
                    style={{
                      fontFamily: "Inter-Medium",
                      color: theme.textMuted,
                    }}
                  >
                    {eventLat.toFixed(6)}, {eventLng.toFixed(6)}
                  </Text>
                )}
              </View>

              <DateSelector
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                isDark={isDark}
              />
              <TimeSelector
                value={startTime}
                onChange={setStartTime}
                isDark={isDark}
                label="Start Time"
              />
              <TimeSelector
                value={endTime}
                onChange={setEndTime}
                isDark={isDark}
                label="End Time"
              />

              {requireFriends && (
                <>
                  <Text
                    className="text-[10px] uppercase tracking-widest mb-2 font-heading"
                    style={{
                      color: theme.textMuted,
                    }}
                  >
                    Invite Friends
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-6"
                  >
                    {innerCircle && innerCircle.length > 0 ? (
                      innerCircle.map((friend) => {
                        const friendId =
                          friend.user1_id === userId
                            ? friend.user2_id
                            : friend.user1_id;
                        const friendProfile =
                          (innerCircleProfiles || {})[friendId] || {};
                        const friendName =
                          friendProfile.full_name ||
                          friendProfile.username ||
                          "Friend";
                        const isSelected = selectedFriends.includes(friendId);
                        return (
                          <TouchableOpacity
                            key={friend.id}
                            onPress={() => toggleFriendSelection(friendId)}
                            className="mr-2 py-2 px-4"
                            style={{
                              borderRadius: theme.elementRadius,
                              backgroundColor: isSelected
                                ? theme.brand
                                : theme.bg,
                              borderWidth: 1,
                              borderColor: theme.borderLight,
                            }}
                          >
                            <Text
                              className="text-[11px]"
                              style={{
                                fontFamily: isSelected
                                  ? "Inter-Bold"
                                  : "Inter-Medium",
                                color: isSelected ? "#FFF" : theme.textMuted,
                              }}
                            >
                              {friendName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text
                        style={{
                          fontFamily: "Inter-Medium",
                          color: theme.textMuted,
                          fontSize: 12,
                        }}
                      >
                        No friends to invite
                      </Text>
                    )}
                  </ScrollView>
                </>
              )}

              <View className="min-h-[20px] mb-2 items-center justify-center">
                {!isTitleFilled && (
                  <Text
                    className="text-red-500 text-[10px] uppercase tracking-widest"
                    style={{ fontFamily: "Inter-Bold" }}
                  >
                    * Title is missing
                  </Text>
                )}
                {isTitleFilled && !isLocationFilled && (
                  <Text
                    className="text-red-500 text-[10px] uppercase tracking-widest"
                    style={{ fontFamily: "Inter-Bold" }}
                  >
                    * Location is missing
                  </Text>
                )}
                {isTitleFilled && isLocationFilled && !timeValid && (
                  <Text
                    className="text-red-500 text-[10px] uppercase tracking-widest"
                    style={{ fontFamily: "Inter-Bold" }}
                  >
                    * Start time must be before End time
                  </Text>
                )}
                {requireFriends &&
                  isTitleFilled &&
                  isLocationFilled &&
                  timeValid &&
                  selectedFriends.length === 0 && (
                    <Text
                      className="text-red-500 text-[10px] uppercase tracking-widest"
                      style={{ fontFamily: "Inter-Bold" }}
                    >
                      * Select at least one friend
                    </Text>
                  )}
              </View>

              <TouchableOpacity
                onPress={onSubmit}
                disabled={!canSubmit}
                className="py-4 items-center"
                style={{
                  borderRadius: theme.elementRadius,
                  backgroundColor: canSubmit ? theme.brand : theme.border,
                  ...Platform.select({
                    ios: {
                      shadowColor: canSubmit ? theme.shadow : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: canSubmit ? 1 : 0,
                      shadowRadius: 8,
                    },
                    android: { elevation: canSubmit ? 6 : 0 },
                  }),
                }}
              >
                <Text
                  className="text-sm uppercase tracking-widest font-heading"
                  style={{
                    color: canSubmit ? "#FFF" : theme.textMuted,
                  }}
                >
                  Send Invites
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} className="mt-6 items-center">
                <Text
                  className="text-[11px] uppercase tracking-widest"
                  style={{
                    fontFamily: "Inter-SemiBold",
                    color: theme.textMuted,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {isLocationModalVisible && (
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1000,
            backgroundColor: theme.bg,
          }}
        >
          <LocationPickerModal
            onClose={() => setLocationModalVisible(false)}
            onLocationSelect={handleLocationSelect}
            isDark={isDark}
          />
        </View>
      )}
    </>
  );
}
