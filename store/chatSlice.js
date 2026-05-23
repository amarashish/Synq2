import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getPrivateMessages,
  getTribeMessages,
  getChatRequestsForUser,
  respondToChatRequest,
  sendMessage,
} from "../lib/api";
import { supabase } from "../constants/supabase";

const initialState = {
  messages: [],
  chatRequests: [],
  status: "idle",
  requestStatus: "idle",
  error: "",
};

export const fetchTribeMessages = createAsyncThunk(
  "chat/fetchTribeMessages",
  async (tribeId, { rejectWithValue }) => {
    console.log("[THUNK][fetchTribeMessages] START - tribeId:", tribeId); 
    const { data, error } = await getTribeMessages(tribeId);
    if (error) {
      console.log("[THUNK][fetchTribeMessages] ERROR:", error.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][fetchTribeMessages] SUCCESS - messages count:", data?.length || 0);
    return data || [];
  },
);

export const fetchPrivateMessages = createAsyncThunk(
  "chat/fetchPrivateMessages",
  async ({ userId, friendId }, { rejectWithValue }) => {
    const { data, error } = await getPrivateMessages({ userId, friendId });
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const fetchChatRequests = createAsyncThunk(
  "chat/fetchChatRequests",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getChatRequestsForUser(userId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const respondToChatRequestThunk = createAsyncThunk(
  "chat/respondToChatRequest",
  async ({ requestId }, { rejectWithValue }) => {
    const { data, error } = await respondToChatRequest(requestId);
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return requestId;
  },
);

export const createMessage = createAsyncThunk(
  "chat/createMessage",
  async ({ tribeId, receiverId, userId, content, username }, { rejectWithValue, getState }) => {
    const tribeName = tribeId
      ? [...(getState().tribe.joinedTribes || []), ...(getState().tribe.availableTribes || [])]
          .find((t) => t.id === tribeId || t.tribe_id === tribeId)?.name || ""
      : "";
    const { data, error } = await sendMessage({
      tribeId,
      tribeName,
      receiverId,
      userId,
      content,
      userName: username
    });
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }
    return data || {};
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addRealtimeMessage: (state, action) => {
      const incomingMessage = action.payload;
      const exists = state.messages.some(
        (message) => message.id === incomingMessage.id,
      );
      if (!exists) {
        state.messages.push(incomingMessage);
      }
    },
    setChatRequests: (state, action) => {
      state.chatRequests = action.payload;
    },
    addChatRequest: (state, action) => {
      if (!state.chatRequests.find(r => r.id === action.payload.id)) {
        state.chatRequests.push(action.payload);
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearChatState: (state) => {
      state.messages = [];
      state.chatRequests = [];
      state.status = "idle";
      state.requestStatus = "idle";
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTribeMessages.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTribeMessages.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.messages = action.payload;
      })
      .addCase(fetchTribeMessages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchPrivateMessages.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPrivateMessages.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.messages = action.payload;
      })
      .addCase(fetchPrivateMessages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchChatRequests.pending, (state) => {
        state.requestStatus = "loading";
        state.error = null;
      })
      .addCase(fetchChatRequests.fulfilled, (state, action) => {
        state.requestStatus = "succeeded";
        state.chatRequests = action.payload;
      })
      .addCase(fetchChatRequests.rejected, (state, action) => {
        state.requestStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(respondToChatRequestThunk.fulfilled, (state, action) => {
        state.chatRequests = state.chatRequests.filter((r) => r.id !== action.payload);
      })
      .addCase(createMessage.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload?.id) {
          state.messages.push(action.payload);
        }
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "";
      });
  },
});

export const { addRealtimeMessage, setChatRequests, clearMessages, addChatRequest, clearChatState } =
  chatSlice.actions;

export const subscribeToMessages = (
  dispatch,
  tribeId = null,
  receiverId = null,
) => {
  const channelName = tribeId ? `tribe-messages-${tribeId}` : `private-messages-${receiverId || 'all'}`;
  
  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const message = payload.new;

        const isTribeMessage =
          tribeId &&
          message.chat_type === "TRIBE_CHAT" &&
          message.tribe_id === tribeId;
        const isPrivateMessage =
          receiverId &&
          message.chat_type === "PRIVATE_CHAT" &&
          (message.receiver_id === receiverId ||
            message.sender_id === receiverId);

        if (isTribeMessage || isPrivateMessage || (!tribeId && !receiverId)) {
          dispatch(addRealtimeMessage(message));
        }
      },
    )
    .subscribe();
};

export default chatSlice.reducer;
