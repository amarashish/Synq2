import { supabase } from "../../constants/supabase";
import { sendPush } from "../pushNotifications";

export const getEvents = async () => {
  console.log("[API][events.getEvents] start");
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });
  if (error) {
    console.log("[API][events.getEvents] error", error?.message);
  } else {
    console.log("[API][events.getEvents] success", { count: data?.length || 0 });
  }
  return { data: data || [], error };
};

export const getEventById = async (eventId) => {
  console.log("[API][events.getEventById] start", eventId);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (error) {
    console.log("[API][events.getEventById] error", error?.message);
  }
  return { data: data || null, error };
};

export const getLiveEventStories = async () => {
  console.log("[API][events.getLiveEventStories] start");
  const { data, error } = await supabase
    .from("event_photos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.log("[API][events.getLiveEventStories] error", error?.message);
  } else {
    console.log("[API][events.getLiveEventStories] success", {
      count: data?.length || 0,
    });
  }
  return { data: data || [], error };
};

export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select("*")
    .single();

  if (!error && data?.id && eventData.tribe_id) {
    sendPush({
      type: "event_created",
      tribe_id: eventData.tribe_id,
      sender_id: eventData.created_by,
      title: "New Event Created",
      body: `${eventData.title} is happening!`,
      data: { eventId: data.id, tribeId: eventData.tribe_id },
    });
  }

  return { data: data || {}, error };
};

export const rsvpEvent = async ({ userId, eventId, status, userName }) => {
  const { data, error } = await supabase
    .from("event_rsvps")
    .upsert(
      {
        event_id: eventId,
        user_id: userId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" },
    )
    .select("*")
    .single();

  if (!error && status === "committed") {
    const { data: event } = await supabase
      .from("events")
      .select("created_by, title")
      .eq("id", eventId)
      .maybeSingle();

    if (event && event.created_by !== userId) {
      sendPush({
        type: "event_commit",
        recipient_user_id: event.created_by,
        sender_id: userId,
        title: "New Attendee",
        body: `${userName || "Someone"} committed to ${event.title}`,
        data: { eventId, userId },
      });
    }
  }

  return { data: data || {}, error };
};

export const checkInToEvent = async ({ userId, eventId, lat, lng }) => {
  const { data, error } = await supabase.rpc("check_in_to_event", {
    p_user_id: userId,
    p_event_id: eventId,
    p_user_lat: lat,
    p_user_lng: lng,
  });

  return { data: data || {}, error };
};

export const updateRsvpStatus = async ({ userId, eventId, status }) => {
  const { data, error } = await supabase
    .from("event_rsvps")
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .select("*");
  return { data: data || {}, error };
};

export const getEventAttendees = async (eventId) => {
  console.log("[API][events.getEventAttendees] start", eventId);
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "attended");
  if (error) {
    console.log("[API][events.getEventAttendees] error", error?.message);
  }
  return { data: data || [], error };
};

export const getUserRsvps = async (userId) => {
  console.log("[API][events.getUserRsvps] start", userId);
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    console.log("[API][events.getUserRsvps] error", error?.message);
  }
  return { data: data || [], error };
};

export const getEventRsvps = async (eventIds = []) => {
  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    return { data: [], error: null };
  }
  console.log("[API][events.getEventRsvps] start", eventIds);
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .in("event_id", eventIds)
    .eq("status", "committed");
  if (error) {
    console.log("[API][events.getEventRsvps] error", error);
  }
  return { data: data || [], error };
};

export const getLiveEvents = async () => {
  console.log("[API][events.getLiveEvents] start");
  // Get ONLY events that are actually live (started and not ended)
  const now = new Date().toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  // Events that started within the last hour and haven't ended
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .lte("start_time", now) // started before now
    .gte("end_time", now) // not ended yet
    .order("start_time", { ascending: true });
  
  if (error) {
    console.log("[API][events.getLiveEvents] error", error?.message);
  } else {
    console.log("[API][events.getLiveEvents] success", { count: data?.length || 0 });
  }
  return { data: data || [], error };
};

export const getPastEvents = async () => {
  console.log("[API][events.getPastEvents] start");
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .lt("end_time", twoHoursAgo)
    .order("start_time", { ascending: false });
  
  if (error) {
    console.log("[API][events.getPastEvents] error", error?.message);
  } else {
    console.log("[API][events.getPastEvents] success", { count: data?.length || 0 });
  }
  return { data: data || [], error };
};

export const uploadEventPhoto = async ({ eventId, userId, photoUrl }) => {
  const { data, error } = await supabase
    .from("event_photos")
    .insert({
      event_id: eventId,
      user_id: userId,
      photo_url: photoUrl,
    })
    .select("*")
    .single();

  return { data: data || {}, error };
};

export const createFriendEvent = async (eventData) => {
  return createEvent(eventData);
};
