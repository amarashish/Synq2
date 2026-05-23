import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getSession,
  getUserProfile,
  updateUserProfile,
  signOut as apiSignOut,
  signIn as apiSignIn,
  signUp as apiSignUp,
} from "../lib/api";
import { unregisterPushToken } from "../lib/pushNotifications";

const initialState = {
  user: {},
  session: {},
  isLoggedIn: false,
  karmaPoints: 0,
  streakCount: 0,
  status: "idle",
  error: "",
};

export const signInUser = createAsyncThunk(
  "auth/signInUser",
  async ({ email, password }, { rejectWithValue }) => {
    console.log("[THUNK][auth/signInUser] start", { email });
    const { data, error } = await apiSignIn({ email, password });
    if (error) {
      console.log("[THUNK][auth/signInUser] failed", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][auth/signInUser] success", {
      hasSession: !!data?.session,
      userId: data?.user?.id || data?.session?.user?.id,
    });
    return data || {};
  },
);

export const signUpUser = createAsyncThunk(
  "auth/signUpUser",
  async ({ email, password, username, fullName }, { rejectWithValue }) => {
    const { data, error } = await apiSignUp({
      email,
      password,
      username,
      fullName,
    });
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || {};
  },
);

export const checkUserSession = createAsyncThunk(
  "auth/checkUserSession",
  async (_, { rejectWithValue }) => {
    console.log("[THUNK][auth/checkUserSession] start");
    const { data: sessionData, error: sessionError } = await getSession();
    if (sessionError) {
      console.log("[THUNK][auth/checkUserSession] session error", sessionError?.message);
      return rejectWithValue(sessionError.message || sessionError.toString());
    }

    const session = sessionData?.session;
    if (!session?.user?.id) {
      console.log("[THUNK][auth/checkUserSession] no session user id");
      return rejectWithValue("No active session found.");
    }

    const { data: profileData, error: profileError } = await getUserProfile(
      session.user.id,
    );
    if (profileError) {
      console.log("[THUNK][auth/checkUserSession] profile fetch failed, using auth user fallback", profileError?.message);
      return {
        session,
        profile: {
          id: session.user.id,
          username: session.user.email || "user",
          full_name: "",
          avatar_url: "",
          karma_points: 0,
        },
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastSparkDate = profileData?.last_spark_date;

    if (lastSparkDate && lastSparkDate !== today && lastSparkDate !== yesterday) {
      profileData.streak_count = 0;
      await updateUserProfile({ userId: session.user.id, updates: { streak_count: 0 } });
    }

    console.log("[THUNK][auth/checkUserSession] success", {
      userId: session.user.id,
      username: profileData?.username,
    });
    return {
      session,
      profile: profileData,
    };
  },
);

export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    unregisterPushToken().catch(() => {});
    const { error } = await apiSignOut();
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return null;
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload || {};
      state.isLoggedIn = !!action.payload?.user?.id;
      state.error = "";
    },
    logout: (state) => {
      state.user = {};
      state.session = {};
      state.isLoggedIn = false;
      state.karmaPoints = 0;
      state.streakCount = 0;
      state.status = "idle";
      state.error = "";
    },
    updateKarma: (state, action) => {
      const nextKarma = action.payload;
      state.karmaPoints = nextKarma;
      if (state.user) {
        state.user.karma_points = nextKarma;
      }
    },
    updateStreak: (state, action) => {
      state.streakCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkUserSession.pending, (state) => {
        state.status = "loading";
        state.error = "";
        console.log("[REDUCER][auth] checkUserSession.pending");
      })
      .addCase(checkUserSession.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.session = action.payload.session;
        state.user = action.payload.profile;
        state.isLoggedIn = true;
        state.karmaPoints = action.payload.profile?.karma_points || 0;
        state.streakCount = action.payload.profile?.streak_count || 0;
        state.error = "";
        console.log("[REDUCER][auth] checkUserSession.fulfilled", {
          userId: action.payload.profile?.id,
        });
      })
      .addCase(checkUserSession.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
        state.isLoggedIn = false;
        state.session = {};
        state.user = {};
        state.karmaPoints = 0;
        console.log("[REDUCER][auth] checkUserSession.rejected", state.error);
      })
      .addCase(signInUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        const session = action.payload?.session || {};
        state.session = session;
        state.isLoggedIn = !!session?.user?.id;
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      })
      .addCase(signUpUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        const session = action.payload?.session || {};
        state.session = session;
        state.isLoggedIn = !!session?.user?.id;
        state.user = action.payload?.user || {};
        state.karmaPoints = action.payload?.user?.karma_points || 0;
        state.streakCount = action.payload?.user?.streak_count || 0;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      })
      .addCase(signOut.pending, (state) => {
        state.status = "loading";
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = {};
        state.session = {};
        state.isLoggedIn = false;
        state.karmaPoints = 0;
        state.streakCount = 0;
        state.status = "idle";
        state.error = "";
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      });
  },
});

export const { setSession, logout, updateKarma, updateStreak } = authSlice.actions;
export default authSlice.reducer;
