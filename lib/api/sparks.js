import { supabase } from "../../constants/supabase";
import { sendPush } from "../pushNotifications";

export const createDailySpark = async ({ tribeId, question, tribeName }) => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("daily_sparks")
    .insert({
      tribe_id: tribeId,
      question,
      target_date: today,
    })
    .select("*")
    .single();

  if (!error && data?.id) {
    sendPush({
      type: "new_spark",
      tribe_id: tribeId,
      title: `New Spark: ${tribeName || "Tribe"}`,
      body: `"${question}" — Answer now to unlock chat!`,
      data: { tribeId, sparkId: data.id, question },
    });
  }

  return { data: data || {}, error };
};

export const getDailySparkByTribe = async (tribeId) => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("daily_sparks")
    .select("*")
    .eq("tribe_id", tribeId)
    .eq("target_date", today)
    .maybeSingle();

  return { data: data || {}, error };
};

export const getDailySparksForTribes = async (tribeIds = []) => {
  if (!Array.isArray(tribeIds) || tribeIds.length === 0) {
    return { data: [], error: null };
  }

  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("daily_sparks")
    .select("*")
    .in("tribe_id", tribeIds)
    .eq("target_date", today);

  return { data: data || [], error };
};

export const answerSpark = async ({ userId, sparkId, answerText }) => {
  console.log("[API][sparks.answerSpark] start", { userId, sparkId });
  
  // 1. Save answer to spark_answers table
  const { data, error } = await supabase
    .from("spark_answers")
    .insert({
      user_id: userId,
      spark_id: sparkId,
      answer_text: answerText,
    })
    .select("*")
    .single();

  if (error) {
    console.log("[API][sparks.answerSpark] insert error", error?.message);
    return { data: {}, error };
  }

  // 2. Update answered_by in daily_sparks table
  const { data: sparkData, error: sparkError } = await supabase
    .from("daily_sparks")
    .select("tribe_id, answered_by")
    .eq("id", sparkId)
    .maybeSingle();

  if (sparkError) {
    console.log("[API][sparks.answerSpark] spark lookup error", sparkError?.message);
    return { data: data || {}, error: sparkError };
  }

  const tribeId = sparkData?.tribe_id;
  const answeredBy = sparkData?.answered_by || [];

  // Append user to answered_by array
  const newAnsweredBy = [...answeredBy, userId];
  const { error: updateError } = await supabase
    .from("daily_sparks")
    .update({ answered_by: newAnsweredBy })
    .eq("id", sparkId);

  if (updateError) {
    console.log("[API][sparks.answerSpark] update answered_by error", updateError?.message);
  }

  // 3. Update has_answered_today in tribe_memberships
  if (tribeId) {
    const { error: membershipError } = await supabase
      .from("tribe_memberships")
      .update({ has_answered_today: true })
      .eq("user_id", userId)
      .eq("tribe_id", tribeId);

    if (membershipError) {
      console.log(
        "[API][sparks.answerSpark] membership update error",
        membershipError?.message,
      );
    }
  }

  // 4. Update user streak
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("streak_count, last_spark_date")
    .eq("id", userId)
    .single();

  if (!profileErr && profile) {
    let newStreak;
    if (profile.last_spark_date === today) {
      newStreak = profile.streak_count;
    } else if (profile.last_spark_date === yesterday) {
      newStreak = (profile.streak_count || 0) + 1;
    } else {
      newStreak = 1;
    }

    await supabase
      .from("profiles")
      .update({ streak_count: newStreak, last_spark_date: today })
      .eq("id", userId);

    data.streak_count = newStreak;
  }

  console.log("[API][sparks.answerSpark] success", { tribeId, answeredBy: newAnsweredBy });
  return { data: data || {}, error: null };
};

export const getSparkAnswer = async ({ userId, sparkId }) => {
  console.log("[API][getSparkAnswer] userId:", userId, "sparkId:", sparkId);
  const { data, error } = await supabase
    .from("spark_answers")
    .select("*")
    .eq("user_id", userId)
    .eq("spark_id", sparkId)
    .maybeSingle();

  if (error) {
    console.log("[API][getSparkAnswer] ERROR:", error.message);
  } else {
    console.log("[API][getSparkAnswer] SUCCESS - data:", data);
  }

  return { data: data || null, error };
};

export const checkUserAnsweredSpark = async ({ userId, sparkId }) => {
  console.log("[API][checkUserAnsweredSpark] userId:", userId, "sparkId:", sparkId);
  
  const { data, error } = await supabase
    .from("daily_sparks")
    .select("answered_by")
    .eq("id", sparkId)
    .maybeSingle();

  if (error) {
    console.log("[API][checkUserAnsweredSpark] ERROR:", error.message);
    return { answered: false, error };
  }

  const answeredBy = data?.answered_by || [];
  const isAnswered = answeredBy.includes(userId);
  console.log("[API][checkUserAnsweredSpark] SUCCESS - answered_by:", answeredBy, "isAnswered:", isAnswered);

  return { answered: isAnswered, error: null };
};
