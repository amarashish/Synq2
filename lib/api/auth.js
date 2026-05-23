import { supabase } from "../../constants/supabase";

export const signUp = async ({ email, password, username, fullName }) => {
  console.log("[API][auth.signUp] start", { email, username });
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.log("[API][auth.signUp] error", signUpError?.message);
    return { data: {}, error: signUpError };
  }

  const userId = signUpData?.user?.id;
  if (!userId) {
    return { data: {}, error: new Error("Unable to create auth user.") };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      username,
      full_name: fullName,
      karma_points: 100,
    })
    .select("*")
    .single();

  if (profileError) {
    console.log("[API][auth.signUp] profile error", profileError?.message);
    return { data: {}, error: profileError };
  }

  console.log("[API][auth.signUp] success", { userId });
  return {
    data: {
      user: profileData || {},
      session: signUpData?.session || {},
    },
    error: null,
  };
};

export const signIn = async ({ email, password }) => {
  console.log("[API][auth.signIn] start", { email });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.log("[API][auth.signIn] error", error?.message);
  } else {
    console.log("[API][auth.signIn] success", {
      userId: data?.user?.id || data?.session?.user?.id,
      hasSession: !!data?.session,
    });
  }
  return { data: data || {}, error };
};

export const signOut = async () => {
  console.log("[API][auth.signOut] start");
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log("[API][auth.signOut] error", error?.message);
  } else {
    console.log("[API][auth.signOut] success");
  }
  return { data: {}, error };
};

export const getSession = async () => {
  console.log("[API][auth.getSession] start");
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log("[API][auth.getSession] error", error?.message);
  } else {
    console.log("[API][auth.getSession] success", {
      hasSession: !!data?.session,
      userId: data?.session?.user?.id || "",
    });
  }
  return { data: data || {}, error };
};
