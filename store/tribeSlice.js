import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getTribes, getNearbyTribes, getJoinedTribes, joinTribes, getTribeDetails, getTribeMembers, getTribeMemberCounts } from "../lib/api";

const initialState = {
  availableTribes: [],
  joinedTribes: [],
  dailySparks: {},
  sparkAnswer: {},
  tribeDetails: null,
  tribeMembers: [],
  tribeMemberCounts: {},
  status: "idle",
  joinStatus: "idle",
  sparkStatus: "idle",
  answerStatus: "idle",
  detailsStatus: "idle",
  membersStatus: "idle",
  error: "",
};

export const fetchAvailableTribes = createAsyncThunk(
  "tribe/fetchAvailableTribes",
  async (_, { rejectWithValue }) => {
    console.log("[THUNK][tribe/fetchAvailableTribes] start");
    const { data, error } = await getTribes();
    if (error) {
      console.log("[THUNK][tribe/fetchAvailableTribes] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][tribe/fetchAvailableTribes] success", {
      count: data?.length || 0,
    });
    return data || [];
  },
);

export const fetchNearbyTribes = createAsyncThunk(
  "tribe/fetchNearbyTribes",
  async (_, { rejectWithValue }) => {
    const { data, error } = await getNearbyTribes();
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const fetchJoinedTribes = createAsyncThunk(
  "tribe/fetchJoinedTribes",
  async (userId, { rejectWithValue }) => {
    console.log("[THUNK][tribe/fetchJoinedTribes] start", { userId });
    const { data, error } = await getJoinedTribes(userId);
    if (error) {
      console.log("[THUNK][tribe/fetchJoinedTribes] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][tribe/fetchJoinedTribes] success", {
      count: data?.length || 0,
    });
    return data || [];
  },
);

export const fetchDailySparkForTribe = createAsyncThunk(
  "tribe/fetchDailySparkForTribe",
  async (tribeId) => {
    return { tribeId, data: {} };
  },
);

export const fetchAllSparksForJoinedTribes = createAsyncThunk(
  "tribe/fetchAllSparksForJoinedTribes",
  async () => {
    return {};
  },
);

export const joinMultipleTribes = createAsyncThunk(
  "tribe/joinMultipleTribes",
  async ({ userId, tribeIds }, { rejectWithValue }) => {
    console.log("[THUNK][tribe/joinMultipleTribes] start", { userId, tribeIds });
    const { data, error } = await joinTribes(userId, tribeIds);
    if (error) {
      console.log("[THUNK][tribe/joinMultipleTribes] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][tribe/joinMultipleTribes] success");
    return data || [];
  },
);

export const submitSparkAnswer = createAsyncThunk(
  "tribe/submitSparkAnswer",
  async () => {
    return {};
  },
);

export const fetchSparkAnswerStatus = createAsyncThunk(
  "tribe/fetchSparkAnswerStatus",
  async () => {
    return {};
  },
);

export const fetchTribeDetails = createAsyncThunk(
  "tribe/fetchTribeDetails",
  async (tribeId, { rejectWithValue }) => {
    console.log("[THUNK][tribe/fetchTribeDetails] start", { tribeId });
    const { data, error } = await getTribeDetails(tribeId);
    if (error) {
      console.log("[THUNK][tribe/fetchTribeDetails] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][tribe/fetchTribeDetails] success", data);
    return data;
  },
);

export const fetchTribeMembers = createAsyncThunk(
  "tribe/fetchTribeMembers",
  async (tribeId, { rejectWithValue }) => {
    console.log("[THUNK][tribe/fetchTribeMembers] start", { tribeId });
    const { data, error } = await getTribeMembers(tribeId);
    if (error) {
      console.log("[THUNK][tribe/fetchTribeMembers] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][tribe/fetchTribeMembers] success", { count: data?.length });
    return data || [];
  },
);

export const fetchTribeMemberCounts = createAsyncThunk(
  "tribe/fetchTribeMemberCounts",
  async (tribeIds, { rejectWithValue }) => {
    console.log("[THUNK][tribe/fetchTribeMemberCounts] start", { count: tribeIds?.length });
    const { data, error } = await getTribeMemberCounts(tribeIds);
    if (error) {
      console.log("[THUNK][tribe/fetchTribeMemberCounts] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    return data || {};
  },
);

const tribeSlice = createSlice({
  name: "tribe",
  initialState,
  reducers: {
    clearDailySparks: (state) => {
      state.dailySparks = {};
    },
    clearTribeDetails: (state) => {
      state.tribeDetails = null;
      state.tribeMembers = [];
      state.detailsStatus = "idle";
      state.membersStatus = "idle";
    },
    clearTribeState: (state) => {
      state.joinedTribes = [];
      state.availableTribes = [];
      state.dailySparks = {};
      state.tribeDetails = null;
      state.tribeMembers = [];
      state.tribeMemberCounts = {};
      state.status = "idle";
      state.detailsStatus = "idle";
      state.membersStatus = "idle";
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAvailableTribes
      .addCase(fetchAvailableTribes.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchAvailableTribes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.availableTribes = action.payload;
      })
      .addCase(fetchAvailableTribes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // fetchNearbyTribes
      .addCase(fetchNearbyTribes.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchNearbyTribes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.availableTribes = action.payload;
      })
      .addCase(fetchNearbyTribes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // fetchJoinedTribes
      .addCase(fetchJoinedTribes.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchJoinedTribes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.joinedTribes = action.payload;
      })
      .addCase(fetchJoinedTribes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // fetchDailySparkForTribe (Single)
      .addCase(fetchDailySparkForTribe.pending, (state) => {
        state.sparkStatus = "loading";
        state.error = "";
      })
      .addCase(fetchDailySparkForTribe.fulfilled, (state, action) => {
        state.sparkStatus = "succeeded";
        const { tribeId, data } = action.payload;
        state.dailySparks[tribeId] = data;
      })
      .addCase(fetchDailySparkForTribe.rejected, (state, action) => {
        state.sparkStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // fetchAllSparksForJoinedTribes (Map)
      .addCase(fetchAllSparksForJoinedTribes.pending, (state) => {
        state.sparkStatus = "loading";
      })
      .addCase(fetchAllSparksForJoinedTribes.fulfilled, (state, action) => {
        state.sparkStatus = "succeeded";
        state.dailySparks = action.payload;
      })
      .addCase(fetchAllSparksForJoinedTribes.rejected, (state, action) => {
        state.sparkStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // joinMultipleTribes
      .addCase(joinMultipleTribes.pending, (state) => {
        state.joinStatus = "loading";
        state.error = "";
      })
      .addCase(joinMultipleTribes.fulfilled, (state, action) => {
        state.joinStatus = "succeeded";
      })
      .addCase(joinMultipleTribes.rejected, (state, action) => {
        state.joinStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // submitSparkAnswer
      .addCase(submitSparkAnswer.pending, (state) => {
        state.sparkStatus = "loading";
        state.error = "";
      })
      .addCase(submitSparkAnswer.fulfilled, (state) => {
        state.sparkStatus = "succeeded";
      })
      .addCase(submitSparkAnswer.rejected, (state, action) => {
        state.sparkStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // fetchSparkAnswerStatus
      .addCase(fetchSparkAnswerStatus.pending, (state) => {
        state.answerStatus = "loading";
        state.error = "";
      })
      .addCase(fetchSparkAnswerStatus.fulfilled, (state, action) => {
        state.answerStatus = "succeeded";
        state.sparkAnswer = action.payload || {};
      })
      .addCase(fetchSparkAnswerStatus.rejected, (state, action) => {
        state.answerStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // fetchTribeDetails
      .addCase(fetchTribeDetails.pending, (state) => {
        state.detailsStatus = "loading";
        state.error = "";
      })
      .addCase(fetchTribeDetails.fulfilled, (state, action) => {
        state.detailsStatus = "succeeded";
        state.tribeDetails = action.payload;
      })
      .addCase(fetchTribeDetails.rejected, (state, action) => {
        state.detailsStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // fetchTribeMembers
      .addCase(fetchTribeMembers.pending, (state) => {
        state.membersStatus = "loading";
        state.error = "";
      })
      .addCase(fetchTribeMembers.fulfilled, (state, action) => {
        state.membersStatus = "succeeded";
        state.tribeMembers = action.payload;
      })
      .addCase(fetchTribeMembers.rejected, (state, action) => {
        state.membersStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      // fetchTribeMemberCounts
      .addCase(fetchTribeMemberCounts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTribeMemberCounts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tribeMemberCounts = { ...state.tribeMemberCounts, ...action.payload };
      })
      .addCase(fetchTribeMemberCounts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      });
  },
});

export const { clearDailySparks, clearTribeDetails, clearTribeState } = tribeSlice.actions;
export default tribeSlice.reducer;
