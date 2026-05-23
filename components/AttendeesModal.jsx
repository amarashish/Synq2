import { View, Text, FlatList, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AvatarWithInitials from "./AvatarWithInitials";
import Skeleton from "./Skeleton";
import { Colors } from "../constants/Colors";

export default function AttendeesModal({
  visible,
  onClose,
  eventTitle,
  attendees,
  eventParticipants,
  userId,
  isDark,
  friendStatusMap,
  onSendFriendRequest,
  isSendingRequest,
  hasAttendedEvent,
  isLoading,
}) {
  const theme = Colors[isDark ? "dark" : "light"];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <View className="flex-1 px-4 pt-4">
          <View
            className="flex-row items-center justify-between mb-4 pb-4"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: theme.borderLight,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: theme.surface }}
            >
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
            <Text
              className="text-base uppercase tracking-tight"
              style={{ fontFamily: "Inter-Bold", color: theme.text }}
            >
              {eventTitle}
            </Text>
            <View className="w-10" />
          </View>
          <Text
            className="text-[11px] mb-4 ml-1"
            style={{ fontFamily: "Inter-SemiBold", color: theme.textMuted }}
          >
            {isLoading
              ? "Loading..."
              : `${attendees.length} attendee${attendees.length !== 1 ? "s" : ""}`}
          </Text>
          <FlatList
            data={isLoading ? Array(5).fill(null) : attendees}
            keyExtractor={(item, index) => item?.user_id || `skeleton-${index}`}
            renderItem={({ item: attendee }) => {
              if (isLoading) {
                return (
                  <View
                    className="flex-row items-center py-3.5"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderLight,
                    }}
                  >
                    <Skeleton
                      variant="circle"
                      width={40}
                      height={40}
                      isDark={isDark}
                    />
                    <View className="flex-1 ml-3">
                      <Skeleton
                        variant="text"
                        width={120}
                        height={12}
                        isDark={isDark}
                      />
                      <View className="mt-1.5">
                        <Skeleton
                          variant="text"
                          width={60}
                          height={10}
                          isDark={isDark}
                        />
                      </View>
                    </View>
                    <Skeleton
                      variant="button"
                      width={60}
                      height={28}
                      isDark={isDark}
                    />
                  </View>
                );
              }
              const profile = eventParticipants[attendee.user_id];
              const friendStatus = friendStatusMap(attendee.user_id);
              return (
                <View
                  className="flex-row items-center py-3.5"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.borderLight,
                  }}
                >
                  <AvatarWithInitials
                    name={profile?.full_name}
                    size={12}
                    isDark={isDark}
                  />
                  <View className="flex-1 ml-3">
                    <Text
                      className="text-sm"
                      style={{
                        fontFamily: "Inter-SemiBold",
                        color: theme.text,
                      }}
                    >
                      {profile?.full_name || "Unknown"}
                    </Text>
                    {friendStatus === "friends" && (
                      <View
                        className="mt-0.5 px-2 py-0.5 rounded-full self-start"
                        style={{ backgroundColor: theme.semanticLight }}
                      >
                        <Text
                          className="text-[8px] uppercase tracking-wider"
                          style={{
                            fontFamily: "Inter-Bold",
                            color: theme.semantic,
                          }}
                        >
                          Friend
                        </Text>
                      </View>
                    )}
                  </View>
                  {friendStatus === "none" &&
                    attendee.user_id !== userId &&
                    (hasAttendedEvent ? (
                      <TouchableOpacity
                        onPress={() => onSendFriendRequest(attendee.user_id)}
                        disabled={isSendingRequest}
                        className="px-4 py-2 rounded-xl"
                        style={{ backgroundColor: theme.brand }}
                      >
                        <Text
                          className="text-white text-[10px] uppercase tracking-wider"
                          style={{ fontFamily: "Inter-Bold" }}
                        >
                          Add
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        className="px-3 py-1.5 rounded-xl"
                        style={{ backgroundColor: theme.surface }}
                      >
                        <Text
                          className="text-[10px]"
                          style={{
                            fontFamily: "Inter-Medium",
                            color: theme.textMuted,
                          }}
                        >
                          Must attend
                        </Text>
                      </View>
                    ))}
                  {friendStatus === "pendingSent" && (
                    <View
                      className="px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: theme.surface }}
                    >
                      <Text
                        className="text-[10px]"
                        style={{
                          fontFamily: "Inter-Medium",
                          color: theme.text,
                        }}
                      >
                        Sent
                      </Text>
                    </View>
                  )}
                  {friendStatus === "pendingReceived" && (
                    <View
                      className="px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: theme.surface }}
                    >
                      <Text
                        className="text-[10px]"
                        style={{
                          fontFamily: "Inter-Medium",
                          color: theme.text,
                        }}
                      >
                        Pending
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
