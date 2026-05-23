import { supabase } from "../../constants/supabase";

export const getTribes = async () => {
  console.log("[API][tribes.getTribes] start");
  const { data, error } = await supabase
    .from("tribes")
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    console.log("[API][tribes.getTribes] error", error?.message);
  } else {
    console.log("[API][tribes.getTribes] success", { count: data?.length || 0 });
  }
  return { data: data || [], error };
};

export const getNearbyTribes = async () => {
  return getTribes();
};

export const getJoinedTribes = async (userId) => {
  console.log("[API][tribes.getJoinedTribes] start", { userId });
  const { data: memberships, error: membershipError } = await supabase
    .from("tribe_memberships")
    .select("tribe_id, has_answered_today")
    .eq("user_id", userId);

  if (membershipError) {
    console.log("[API][tribes.getJoinedTribes] membership error", membershipError?.message);
    return { data: [], error: membershipError };
  }

  const tribeIds = (memberships || []).map((item) => item.tribe_id);
  if (tribeIds.length === 0) {
    console.log("[API][tribes.getJoinedTribes] success", { count: 0 });
    return { data: [], error: null };
  }

  const { data: tribes, error: tribesError } = await supabase
    .from("tribes")
    .select("*")
    .in("id", tribeIds);

  if (tribesError) {
    console.log("[API][tribes.getJoinedTribes] tribes error", tribesError?.message);
    return { data: [], error: tribesError };
  }

  const hasAnsweredMap = (memberships || []).reduce((acc, item) => {
    acc[item.tribe_id] = !!item.has_answered_today;
    return acc;
  }, {});

  const merged = (tribes || []).map((tribe) => ({
    ...tribe,
    has_answered_today: hasAnsweredMap[tribe.id] || false,
  }));

  console.log("[API][tribes.getJoinedTribes] success", { count: merged.length });
  return { data: merged, error: null };
};

export const joinTribes = async (userId, tribeIdsArray = []) => {
  console.log("[API][tribes.joinTribes] start", { userId, tribeIdsArray });
  const rows = tribeIdsArray.map((tribeId) => ({
    user_id: userId,
    tribe_id: tribeId,
  }));

  const { data, error } = await supabase.from("tribe_memberships").insert(rows);
  if (error) {
    console.log("[API][tribes.joinTribes] error", error?.message);
  } else {
    console.log("[API][tribes.joinTribes] success");
  }
  return { data: data || [], error };
};

export const getTribeDetails = async (tribeId) => {
  console.log("[API][tribes.getTribeDetails] start", { tribeId });
  
  const { data: tribe, error: tribeError } = await supabase
    .from("tribes")
    .select("*")
    .eq("id", tribeId)
    .single();

  if (tribeError) {
    console.log("[API][tribes.getTribeDetails] error", tribeError?.message);
    return { data: null, error: tribeError };
  }

  const { count: memberCount } = await supabase
    .from("tribe_memberships")
    .select("*", { count: "exact" })
    .eq("tribe_id", tribeId);

  const { count: eventCount } = await supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("tribe_id", tribeId);

  return {
    data: {
      ...tribe,
      memberCount: memberCount || 0,
      eventCount: eventCount || 0,
    },
    error: null,
  };
};

export const getTribeMembers = async (tribeId) => {
  console.log("[API][tribes.getTribeMembers] start", { tribeId });
  
  const { data: memberships, error } = await supabase
    .from("tribe_memberships")
    .select("user_id, joined_at")
    .eq("tribe_id", tribeId)
    .order("joined_at", { ascending: false });

  if (error) {
    console.log("[API][tribes.getTribeMembers] error", error?.message);
    return { data: [], error };
  }

  if (!memberships || memberships.length === 0) {
    return { data: [], error: null };
  }

  const userIds = memberships.map((m) => m.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", userIds);

  const profileMap = {};
  (profiles || []).forEach((p) => {
    profileMap[p.id] = p;
  });

  const members = memberships.map((m) => ({
    ...m,
    profile: profileMap[m.user_id] || {},
  }));

  console.log("[API][tribes.getTribeMembers] success", { count: members.length });
  return { data: members, error: null };
};

export const getTribeMemberCounts = async (tribeIds) => {
  console.log("[API][tribes.getTribeMemberCounts] start", { tribeIdsCount: tribeIds?.length });
  if (!tribeIds || tribeIds.length === 0) return { data: {}, error: null };

  const { data, error } = await supabase
    .from("tribe_memberships")
    .select("tribe_id", { count: "exact", head: true })
    .in("tribe_id", tribeIds);

  if (error) {
    console.log("[API][tribes.getTribeMemberCounts] error", error?.message);
    return { data: {}, error };
  }

  const counts = {};
  for (const id of tribeIds) {
    const { count } = await supabase
      .from("tribe_memberships")
      .select("*", { count: "exact", head: true })
      .eq("tribe_id", id);
    counts[id] = count || 0;
  }

  console.log("[API][tribes.getTribeMemberCounts] success", counts);
  return { data: counts, error: null };
};
