import { supabase } from "../../constants/supabase";

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

    console.log("PROFILE",data)

  return { data: data || {}, error };
};

export const updateUserProfile = async ({ userId, updates }) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates || {})
    .eq("id", userId)
    .select("*")
    .single();

  return { data: data || {}, error };
};

export const getProfilesByIds = async (userIds = []) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  return { data: data || [], error };
};
