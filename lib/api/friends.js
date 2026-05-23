import { supabase } from "../../constants/supabase";
import { sendPush } from "../pushNotifications";

export const getFriendshipsForUser = async (userId) => {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
};

export const getFriendshipsForUserWithProfiles = async (userId) => {
  const { data: friendships, error: friendshipsError } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (friendshipsError) return { data: { friendships: [], profiles: {} }, error: friendshipsError };

  const friendIds = friendships.map(f => 
    f.user1_id === userId ? f.user2_id : f.user1_id
  );

  let profiles = {};
  if (friendIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", friendIds);
    
    if (profileData) {
      profileData.forEach(p => { profiles[p.id] = p; });
    }
  }

  return { data: { friendships, profiles }, error: null };
};

export const getPendingFriendRequests = async (userId) => {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .eq("user2_id", userId)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
};

export const getPendingRequestsWithProfiles = async (userId) => {
  const { data: requests, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .eq("user2_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: { requests: [], profiles: {} }, error };

  const senderIds = requests.map(r => r.user1_id);
  let profiles = {};
  if (senderIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", senderIds);
    
    if (profileData) {
      profileData.forEach(p => { profiles[p.id] = p; });
    }
  }

  return { data: { requests, profiles }, error: null };
};

export const getSentRequestsWithProfiles = async (userId) => {
  const { data: requests, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .eq("user1_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: { requests: [], profiles: {} }, error };

  const receiverIds = requests.map(r => r.user2_id);
  let profiles = {};
  if (receiverIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", receiverIds);
    
    if (profileData) {
      profileData.forEach(p => { profiles[p.id] = p; });
    }
  }

  return { data: { requests, profiles }, error: null };
};

export const getMetAtEventUsers = async (userId) => {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("status", "accepted")
    .not("met_at_event_id", "is", null)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
};

export const updateFriendRequestStatus = async ({ friendshipId, status, accepterUsername }) => {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status })
    .eq("id", friendshipId)
    .select("*")
    .single();

  if (!error && status === "accepted" && data) {
    const requesterId = data.user1_id;
    const accepterId = data.user2_id;
    sendPush({
      type: "friend_request_accepted",
      recipient_user_id: requesterId,
      sender_id: accepterId,
      title: "Request Accepted",
      body: `${accepterUsername || "Someone"} accepted your friend request`,
      data: { accepterId, friendshipId },
    });
  }

  return { data: data || {}, error };
};

export const deleteFriendRequest = async ({ friendshipId }) => {
  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
  return { data: {}, error };
};

export const sendFriendRequest = async ({ senderId, senderUsername, receiverId, metAtEventId }) => {
  console.log("[API][friends.sendFriendRequest] start", { senderId, receiverId, metAtEventId });
  
  const { data: existing } = await supabase
    .from("friendships")
    .select("*")
    .or(`and(user1_id.eq.${senderId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${senderId})`)
    .maybeSingle();
  
  if (existing) {
    console.log("[API][friends.sendFriendRequest] existing relationship found");
    return { data: existing, error: null };
  }
  
  const { data, error } = await supabase
    .from("friendships")
    .insert({
      user1_id: senderId,
      user2_id: receiverId,
      status: "pending",
      met_at_event_id: metAtEventId,
    })
    .select("*")
    .single();

  if (error) {
    console.log("[API][friends.sendFriendRequest] error", error?.message);
  } else if (data?.id) {
    sendPush({
      type: "friend_request",
      recipient_user_id: receiverId,
      sender_id: senderId,
      title: "Friend Request",
      body: `${senderUsername || "Someone"} sent you a friend request`,
      data: { senderId, friendshipId: data.id },
    });
  }
  return { data: data || {}, error };
};

export const removeFriendship = async ({ user1Id, user2Id }) => {
  console.log("[API][friends.removeFriendship]", { user1Id, user2Id });
  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`);
  
  if (error) {
    console.log("[API][friends.removeFriendship] error", error?.message);
  }
  return { data: {}, error };
};