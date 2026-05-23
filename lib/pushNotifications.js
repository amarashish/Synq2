import { supabase } from "../constants/supabase";
import { Platform } from "react-native";
import Constants from "expo-constants";

let Notifications = null;
let Device = null;

let isExpoGo = false;
try {
  isExpoGo = Constants.appOwnership === "expo";
} catch (e) {
  // appOwnership not available
}

if (!isExpoGo) {
  try {
    const NotificationsModule = require("expo-notifications");
    const DeviceModule = require("expo-device");
    Notifications = NotificationsModule;
    Device = DeviceModule;
  } catch (e) {
    // modules not available
  }
}

export async function sendPush(payload) {
  return supabase.functions.invoke("send-push", { body: payload }).catch(() => {});
}

export async function registerPushToken(userId) {
  if (isExpoGo || !Notifications || !Device) return;
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
  if (!tokenData) return;

  await supabase.from("push_tokens").upsert(
    { user_id: userId, token: tokenData.data, platform: Platform.OS },
    { onConflict: "token" },
  );
}

export async function unregisterPushToken() {
  if (isExpoGo || !Notifications) return;
  const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
  if (!tokenData) return;

  await supabase.from("push_tokens").delete().eq("token", tokenData.data).catch(() => {});
}

export function configurePushNotifications() {
  if (isExpoGo || !Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#f43f5e",
    }).catch(() => {});
  }
}
