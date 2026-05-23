import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createDailySpark,
  getDailySparkByTribe,
  getDailySparksForTribes,
  answerSpark,
  getSparkAnswer,
  checkUserAnsweredSpark,
} from "../lib/api";

const initialState = {
  dailySparkByTribe: {},
  sparkAnswerBySparkId: {},
  status: "idle",
  submitStatus: "idle",
  answerStatus: "idle",
  createStatus: "idle",
  error: "",
};

export const fetchDailySparkForTribe = createAsyncThunk(
  "spark/fetchDailySparkForTribe",
  async (tribeId, { rejectWithValue }) => {
    const { data, error } = await getDailySparkByTribe(tribeId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return { tribeId, spark: data || {} };
  },
);

export const fetchAllSparksForJoinedTribes = createAsyncThunk(
  "spark/fetchAllSparksForJoinedTribes",
  async (joinedTribes = [], { rejectWithValue }) => {
    const tribeIds = joinedTribes.map((tribe) => tribe.id);
    const { data, error } = await getDailySparksForTribes(tribeIds);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }

    const map = (data || []).reduce((acc, spark) => {
      acc[spark.tribe_id] = spark;
      return acc;
    }, {});
    return map;
  },
);

export const submitSparkAnswer = createAsyncThunk(
  "spark/submitSparkAnswer",
  async ({ userId, sparkId, answerText }, { rejectWithValue }) => {
    const { data, error } = await answerSpark({ userId, sparkId, answerText });
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || {};
  },
);

export const fetchSparkAnswerStatus = createAsyncThunk(
  "spark/fetchSparkAnswerStatus",
  async ({ userId, sparkId }, { rejectWithValue }) => {
    console.log("[THUNK][fetchSparkAnswerStatus] START - userId:", userId, "sparkId:", sparkId);
    const { data, error } = await getSparkAnswer({ userId, sparkId });
    if (error) {
      console.log("[THUNK][fetchSparkAnswerStatus] ERROR:", error.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][fetchSparkAnswerStatus] SUCCESS - answer data:", data);
    return { sparkId, answer: data || null };
  },
);

export const createDailySparkForTribe = createAsyncThunk(
  "spark/createDailySparkForTribe",
  async ({ tribeId, question }, { rejectWithValue, getState }) => {
    const state = getState().tribe;
    const tribes = [...(state.joinedTribes || []), ...(state.availableTribes || [])];
    const tribeName = tribes.find((t) => t.id === tribeId || t.tribe_id === tribeId)?.name || "";
    const { data, error } = await createDailySpark({ tribeId, question, tribeName });
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data;
  },
);

export const checkSparkAnswered = createAsyncThunk(
  "spark/checkSparkAnswered",
  async ({ userId, sparkId }, { rejectWithValue }) => {
    console.log("[THUNK][checkSparkAnswered] START - userId:", userId, "sparkId:", sparkId);
    const { answered, error } = await checkUserAnsweredSpark({ userId, sparkId });
    if (error) {
      console.log("[THUNK][checkSparkAnswered] ERROR:", error.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][checkSparkAnswered] SUCCESS - answered:", answered);
    return { sparkId, answered };
  },
);

const sparkSlice = createSlice({
  name: "spark",
  initialState,
  reducers: {
    clearSparkState: (state) => {
      state.dailySparkByTribe = {};
      state.sparkAnswerBySparkId = {};
      state.status = "idle";
      state.submitStatus = "idle";
      state.answerStatus = "idle";
      state.createStatus = "idle";
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailySparkForTribe.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchDailySparkForTribe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dailySparkByTribe[action.payload.tribeId] = action.payload.spark;
      })
      .addCase(fetchDailySparkForTribe.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      })
      .addCase(fetchAllSparksForJoinedTribes.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchAllSparksForJoinedTribes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dailySparkByTribe = action.payload || {};
      })
      .addCase(fetchAllSparksForJoinedTribes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      })
      .addCase(submitSparkAnswer.pending, (state) => {
        state.submitStatus = "loading";
        state.error = "";
      })
      .addCase(submitSparkAnswer.fulfilled, (state, action) => {
        state.submitStatus = "succeeded";
        const sparkId = action.payload?.spark_id;
        if (sparkId) {
          state.sparkAnswerBySparkId[sparkId] = action.payload;
        }
      })
      .addCase(submitSparkAnswer.rejected, (state, action) => {
        state.submitStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      .addCase(fetchSparkAnswerStatus.pending, (state) => {
        state.answerStatus = "loading";
        state.error = "";
      })
      .addCase(fetchSparkAnswerStatus.fulfilled, (state, action) => {
        state.answerStatus = "succeeded";
        state.sparkAnswerBySparkId[action.payload.sparkId] = action.payload.answer;
      })
      .addCase(fetchSparkAnswerStatus.rejected, (state, action) => {
        state.answerStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      .addCase(createDailySparkForTribe.pending, (state) => {
        state.createStatus = "loading";
        state.error = "";
      })
      .addCase(createDailySparkForTribe.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const spark = action.payload;
        if (spark?.tribe_id) {
          state.dailySparkByTribe[spark.tribe_id] = spark;
        }
      })
      .addCase(createDailySparkForTribe.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload || action.error.message || "";
      })
      .addCase(checkSparkAnswered.pending, (state) => {
        state.answerStatus = "loading";
        state.error = "";
      })
      .addCase(checkSparkAnswered.fulfilled, (state, action) => {
        state.answerStatus = "succeeded";
        // Store answered status in sparkAnswerBySparkId as boolean
        const { sparkId, answered } = action.payload;
        state.sparkAnswerBySparkId[sparkId] = answered ? { id: sparkId } : null;
      })
      .addCase(checkSparkAnswered.rejected, (state, action) => {
        state.answerStatus = "failed";
        state.error = action.payload || action.error.message || "";
      });
  },
});

export const { clearSparkState } = sparkSlice.actions;
export default sparkSlice.reducer;
