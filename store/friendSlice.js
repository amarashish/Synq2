import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getFriendshipsForUser,
  getFriendshipsForUserWithProfiles,
  getPendingFriendRequests,
  getPendingRequestsWithProfiles,
  getSentRequestsWithProfiles,
  getMetAtEventUsers,
  updateFriendRequestStatus,
  deleteFriendRequest,
  createFriendEvent as createFriendEventApi,
  sendFriendRequest as sendFriendRequestApi,
  removeFriendship,
} from "../lib/api";

const initialState = {
  innerCircle: [],
  innerCircleProfiles: {},
  pendingRequests: [],
  pendingRequestProfiles: {},
  sentRequests: [],
  sentRequestProfiles: {},
  metAtEventUsers: [],
  status: "idle",
  requestStatus: "idle",
  error: "",
};

export const fetchInnerCircle = createAsyncThunk(
  "friend/fetchInnerCircle",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getFriendshipsForUser(userId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const fetchInnerCircleWithProfiles = createAsyncThunk(
  "friend/fetchInnerCircleWithProfiles",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getFriendshipsForUserWithProfiles(userId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || { friendships: [], profiles: {} };
  },
);

export const fetchPendingFriendRequests = createAsyncThunk(
  "friend/fetchPendingFriendRequests",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getPendingFriendRequests(userId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const fetchPendingRequestsWithProfiles = createAsyncThunk(
  "friend/fetchPendingRequestsWithProfiles",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getPendingRequestsWithProfiles(userId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || { requests: [], profiles: {} };
  },
);

export const fetchSentRequests = createAsyncThunk(
  "friend/fetchSentRequests",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getSentRequestsWithProfiles(userId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || { requests: [], profiles: {} };
  },
);

export const fetchMetAtEventUsers = createAsyncThunk(
  "friend/fetchMetAtEventUsers",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getMetAtEventUsers(userId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const acceptFriendRequest = createAsyncThunk(
  "friend/acceptFriendRequest",
  async ({ friendshipId }, { rejectWithValue, getState }) => {
    const accepterUsername = getState().auth.user?.username || "";
    const { data, error } = await updateFriendRequestStatus(
      { friendshipId, status: "accepted", accepterUsername },
    );
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || null;
  },
);

export const declineFriendRequest = createAsyncThunk(
  "friend/declineFriendRequest",
  async ({ friendshipId }, { rejectWithValue }) => {
    const { data, error } = await deleteFriendRequest({ friendshipId });
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || null;
  },
);

export const sendFriendRequest = createAsyncThunk(
  "friend/sendFriendRequest",
  async ({ senderId, receiverId, metAtEventId }, { rejectWithValue, getState }) => {
    console.log("[THUNK][friend/sendFriendRequest] start", { senderId, receiverId, metAtEventId });
    const senderUsername = getState().auth.user?.username || "";
    const { data, error } = await sendFriendRequestApi({
      senderId,
      senderUsername,
      receiverId,
      metAtEventId,
    });
    if (error) {
      console.log("[THUNK][friend/sendFriendRequest] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    return data || null;
  },
);

export const createFriendEvent = createAsyncThunk(
  "friend/createFriendEvent",
  async (eventPayload, { rejectWithValue }) => {
    const { data, error } = await createFriendEventApi(eventPayload);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || null;
  },
);

export const unfriendUser = createAsyncThunk(
  "friend/unfriendUser",
  async ({ userId, friendId }, { rejectWithValue }) => {
    console.log("[THUNK][friend/unfriendUser]", { userId, friendId });
    const { error } = await removeFriendship({ user1Id: userId, user2Id: friendId });
    if (error) {
      console.log("[THUNK][friend/unfriendUser] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    return { success: true, friendId };
  },
);

const friendSlice = createSlice({
  name: "friend",
  initialState,
  reducers: {
    clearFriendState: (state) => {
      state.innerCircle = [];
      state.innerCircleProfiles = {};
      state.pendingRequests = [];
      state.pendingRequestProfiles = {};
      state.sentRequests = [];
      state.sentRequestProfiles = {};
      state.metAtEventUsers = [];
      state.error = null;
      state.status = "idle";
      state.requestStatus = "idle";
    },
    addPendingRequest: (state, action) => {
      if (!state.pendingRequests.find(r => r.id === action.payload.id)) {
        state.pendingRequests.push(action.payload);
      }
    },
    addPendingRequestProfile: (state, action) => {
      const { userId, profile } = action.payload;
      state.pendingRequestProfiles[userId] = profile;
    },
    addChatRequest: (state, action) => {
      if (!state.chatRequests?.find(r => r.id === action.payload.id)) {
        state.chatRequests.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInnerCircle.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInnerCircle.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.innerCircle = action.payload;
      })
      .addCase(fetchInnerCircle.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchInnerCircleWithProfiles.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInnerCircleWithProfiles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.innerCircle = action.payload.friendships || [];
        state.innerCircleProfiles = action.payload.profiles || {};
      })
      .addCase(fetchInnerCircleWithProfiles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchPendingFriendRequests.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(fetchPendingFriendRequests.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
        state.pendingRequests = action.payload;
      })
      .addCase(fetchPendingFriendRequests.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchPendingRequestsWithProfiles.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(fetchPendingRequestsWithProfiles.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
        state.pendingRequests = action.payload.requests || [];
        state.pendingRequestProfiles = action.payload.profiles || {};
      })
      .addCase(fetchPendingRequestsWithProfiles.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchSentRequests.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(fetchSentRequests.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
        state.sentRequests = action.payload.requests || [];
        state.sentRequestProfiles = action.payload.profiles || {};
      })
      .addCase(fetchSentRequests.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchMetAtEventUsers.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(fetchMetAtEventUsers.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
        state.metAtEventUsers = action.payload;
      })
      .addCase(fetchMetAtEventUsers.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(acceptFriendRequest.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(declineFriendRequest.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(declineFriendRequest.fulfilled, (state) => {
        state.requestStatus = "succeeded";
      })
      .addCase(declineFriendRequest.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(sendFriendRequest.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
        if (action.payload && action.payload.status === "pending") {
          state.sentRequests.push(action.payload);
        }
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createFriendEvent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createFriendEvent.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createFriendEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(unfriendUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.innerCircle = state.innerCircle.filter(f => 
          f.user1_id !== action.payload.friendId && f.user2_id !== action.payload.friendId
        );
      });
  },
});

export const { clearFriendState, addPendingRequest, addPendingRequestProfile, addChatRequest } = friendSlice.actions;
export default friendSlice.reducer;
