import { supabase } from "../../constants/supabase";
import { sendPush } from "../pushNotifications";

export const getTribeMessages = async (tribeId) => {
  console.log("[API][getTribeMessages] tribeId:", tribeId);
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_type", "TRIBE_CHAT")
    .eq("tribe_id", tribeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.log("[API][getTribeMessages] ERROR:", error.message, error.details);
  } else {
    console.log("[API][getTribeMessages] SUCCESS - count:", data?.length || 0, "messages:", data);
  }

  return { data: data || [], error };
};

export const getPrivateMessages = async ({ userId, friendId }) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_type", "PRIVATE_CHAT")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true });

  return { data: data || [], error };
};

export const sendMessage = async ({ tribeId, tribeName, receiverId, userId, content,userName }) => {
  const isTribe = !!tribeId;
  const { data, error } = await supabase
    .from("messages")
    .insert({
      tribe_id: tribeId || null,
      receiver_id: receiverId || null,
      sender_id: userId,
      sender_name:userName,
      content,
      chat_type: isTribe ? "TRIBE_CHAT" : "PRIVATE_CHAT",
    })
    .select("*")
    .single();

  if (!error && data?.id) {
    if (isTribe && tribeId) {
      sendPush({
        type: "new_message",
        tribe_id: tribeId,
        sender_id: userId,
        title: tribeName || "Tribe",
        body: `${userName || "Someone"}: ${content}`,
        data: { tribeId, messageId: data.id },
      });
    } else if (receiverId) {
      sendPush({
        type: "new_private_message",
        recipient_user_id: receiverId,
        sender_id: userId,
        title: userName || "Someone",
        body: content,
        data: { senderId: userId, messageId: data.id },
      });
    }
  }

  return { data: data || {}, error };
};

export const getChatRequestsForUser = async (userId) => {
  const { data, error } = await supabase
    .from("chat_requests")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
};

export const respondToChatRequest = async (requestId) => {
  const { data, error } = await supabase
    .from("chat_requests")
    .delete()
    .eq("id", requestId)
    .select("*")
    .single();

  return { data: data || {}, error };
};
