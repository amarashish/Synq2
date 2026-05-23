import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getUserProfile, updateUserProfile } from "../lib/api";

const initialState = {
  profile: {},
  status: "idle",
  updateStatus: "idle",
  error: "",
};

export const fetchProfileByUserId = createAsyncThunk(
  "profile/fetchProfileByUserId",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getUserProfile(userId);
    console.log("Profile data",data)
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || {};
  },
);

export const saveProfileByUserId = createAsyncThunk(
  "profile/saveProfileByUserId",
  async ({ userId, updates }, { rejectWithValue }) => {
    const { data, error } = await updateUserProfile({ userId, updates });
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || {};
  },
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileByUserId.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchProfileByUserId.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profile = action.payload || {};
      })
      .addCase(fetchProfileByUserId.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      })
      .addCase(saveProfileByUserId.pending, (state) => {
        state.updateStatus = "loading";
        state.error = "";
      })
      .addCase(saveProfileByUserId.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.profile = action.payload || {};
      })
      .addCase(saveProfileByUserId.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload || action.error.message || "";
      });
  },
});

export default profileSlice.reducer;
