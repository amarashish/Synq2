import { supabase } from "../../constants/supabase";
import { sendPush } from "../pushNotifications";

export const createFriendEventInvites = async (eventId, invitedUserIds, eventTitle, creatorName, creatorId) => {
  console.log("[API][friendEventInvites.createFriendEventInvites] start", { eventId, invitedUserIds });
  const invitePayloads = invitedUserIds.map(userId => ({
    event_id: eventId,
    user_id: userId,
    status: 'invited',
    updated_at: new Date().toISOString(),
  }));
  const { data, error } = await supabase
    .from("event_rsvps")
    .insert(invitePayloads)
    .select("*");
  if (error) {
    console.log("[API][friendEventInvites.createFriendEventInvites] error", error?.message);
  } else if (data && data.length > 0) {
    invitedUserIds.forEach((userId) => {
      sendPush({
        type: "event_invite",
        recipient_user_id: userId,
        sender_id: creatorId,
        event_id: eventId,
        title: "Event Invite",
        body: `${creatorName || "Someone"} invited you to ${eventTitle || "an event"}`,
        data: { eventId, creatorId },
      });
    });
  }
  return { data: data || [], error };
};

export const getPendingEventInvites = async (userId) => {
  console.log("[API][friendEventInvites.getPendingEventInvites] start", userId);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("event_rsvps")
    .select(`
      *,
      events (
        id, title, description, start_time, end_time, event_type,
        tribe_id, creator_id, karma_cost, location_name, lat, lng
      )
    `)
    .eq("user_id", userId)
    .eq("status", "invited")
    .gte("events.end_time", now)
    .order("updated_at", { ascending: false });
  if (error) {
    console.log("[API][friendEventInvites.getPendingEventInvites] error", error?.message);
  }
  return { data: data || [], error };
};

export const getCommittedFriendEvents = async (userId) => {
  console.log("[API][friendEventInvites.getCommittedFriendEvents] start", userId);
  const { data, error } = await supabase
    .from("event_rsvps")
    .select(`
      *,
      events (
        id, title, description, start_time, end_time, event_type,
        tribe_id, creator_id, karma_cost, location_name, lat, lng
      )
    `)
    .eq("user_id", userId)
    .eq("status", "committed");
  if (error) {
    console.log("[API][friendEventInvites.getCommittedFriendEvents] error", error?.message);
  }
  const filtered = (data || []).filter(
    (rsvp) => rsvp.events?.event_type === "FRIEND_EVENT"
  );
  filtered.sort((a, b) => new Date(a.events?.start_time) - new Date(b.events?.start_time));
  return { data: filtered, error: null };
};

export const createCreatorRsvp = async (eventId, creatorId) => {
  console.log("[API][friendEventInvites.createCreatorRsvp] start", { eventId, creatorId });
  const { data, error } = await supabase
    .from("event_rsvps")
    .insert({
      event_id: eventId,
      user_id: creatorId,
      status: 'committed',
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) {
    console.log("[API][friendEventInvites.createCreatorRsvp] error", error?.message);
  }
  return { data: data || {}, error };
};

export const getFriendEventAttendeeCounts = async (eventIds) => {
  if (!eventIds || eventIds.length === 0) return { data: {}, error: null };
  console.log("[API][friendEventInvites.getFriendEventAttendeeCounts] start", eventIds);
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .eq("status", "committed")
    .in("event_id", eventIds);
  if (error) {
    console.log("[API][friendEventInvites.getFriendEventAttendeeCounts] error", error?.message);
    return { data: {}, error };
  }
  const counts = {};
  (data || []).forEach((rsvp) => {
    counts[rsvp.event_id] = (counts[rsvp.event_id] || 0) + 1;
  });
  return { data: counts, error: null };
};

export const respondToFriendEventInvite = async ({ userId, eventId, status }) => {
  console.log("[API][friendEventInvites.respondToFriendEventInvite] start", { userId, eventId, status });
  if (status === 'declined') {
    const { data, error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .select("*")
      .single();
    if (error) {
      console.log("[API][friendEventInvites.respondToFriendEventInvite] decline error", error?.message);
    }
    return { data: data || {}, error };
  }
  const { data, error } = await supabase
    .from("event_rsvps")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .select("*")
    .single();
  if (error) {
    console.log("[API][friendEventInvites.respondToFriendEventInvite] error", error?.message);
  }
  return { data: data || {}, error };
};
