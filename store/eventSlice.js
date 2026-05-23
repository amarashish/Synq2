import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as Location from "expo-location";
import {
  getEvents,
  getEventById,
  getLiveEventStories,
  getLiveEvents,
  getPastEvents,
  rsvpEvent,
  checkInToEvent,
  createEvent,
  getUserRsvps,
  getEventRsvps,
  updateRsvpStatus,
  getEventAttendees,
} from "../lib/api";
import { updateKarma } from "./authSlice";
import { getProfilesByIds } from "../lib/api/profiles";
import {
  createFriendEventInvites,
  createCreatorRsvp,
  getPendingEventInvites,
  getCommittedFriendEvents,
  getFriendEventAttendeeCounts,
  respondToFriendEventInvite as respondToFriendEventInviteApi,
} from "../lib/api/friendEventInvites";

const initialState = {
  events: [],
  liveStories: [],
  liveEvents: [],
  pastEvents: [],
  committedEvents: [],
  attendedEvents: [],
  eventRsvps: {},
  eventParticipants: {},
  pendingFriendEventInvites: [],
  committedFriendEvents: [],
  friendEventAttendeeCounts: {},
  status: "idle",
  checkInStatus: "idle",
  error: "",
  eventsLoaded: false,
};

export const fetchEvents = createAsyncThunk(
  "event/fetchEvents",
  async (_, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchEvents] start");
    const { data, error } = await getEvents();
    if (error) {
      console.log("[THUNK][event/fetchEvents] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][event/fetchEvents] success", { count: data?.length || 0 });
    return data || [];
  },
);

export const fetchLiveStories = createAsyncThunk(
  "event/fetchLiveStories",
  async (_, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchLiveStories] start");
    const { data, error } = await getLiveEventStories();
    if (error) {
      console.log("[THUNK][event/fetchLiveStories] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][event/fetchLiveStories] success", {
      count: data?.length || 0,
    });
    return data || [];
  },
);

export const fetchLiveEvents = createAsyncThunk(
  "event/fetchLiveEvents",
  async (_, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchLiveEvents] start");
    const { data, error } = await getLiveEvents();
    if (error) {
      console.log("[THUNK][event/fetchLiveEvents] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][event/fetchLiveEvents] success", {
      count: data?.length || 0,
    });
    return data || [];
  },
);

export const fetchPastEvents = createAsyncThunk(
  "event/fetchPastEvents",
  async (_, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchPastEvents] start");
    const { data, error } = await getPastEvents();
    if (error) {
      console.log("[THUNK][event/fetchPastEvents] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    console.log("[THUNK][event/fetchPastEvents] success", {
      count: data?.length || 0,
    });
    return data || [];
  },
);

export const fetchUserRsvps = createAsyncThunk(
  "event/fetchUserRsvps",
  async (userId, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchUserRsvps] start", userId);
    const { data, error } = await getUserRsvps(userId);
    if (error) {
      console.log("[THUNK][event/fetchUserRsvps] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const fetchEventRsvps = createAsyncThunk(
  "event/fetchEventRsvps",
  async (eventIds, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchEventRsvps] start", eventIds);
    const { data, error } = await getEventRsvps(eventIds);
    if (error) {
      console.log("[THUNK][event/fetchEventRsvps] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const fetchAttendedEvents = createAsyncThunk(
  "event/fetchAttendedEvents",
  async (userId, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchAttendedEvents] start", userId);
    const { data, error } = await getUserRsvps(userId);
    if (error) {
      console.log("[THUNK][event/fetchAttendedEvents] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    const attendedRsvps = (data || []).filter(r => r.status === "attended");
    return attendedRsvps || [];
  },
);

export const fetchEventAttendees = createAsyncThunk(
  "event/fetchEventAttendees",
  async (eventId, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchEventAttendees] start", eventId);
    const { data, error } = await getEventAttendees(eventId);
    if (error) {
      console.log("[THUNK][event/fetchEventAttendees] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const fetchParticipantProfiles = createAsyncThunk(
  "event/fetchParticipantProfiles",
  async (userIds, { rejectWithValue }) => {
    console.log("[THUNK][event/fetchParticipantProfiles] start", userIds);
    const { data, error } = await getProfilesByIds(userIds);
    if (error) {
      console.log("[THUNK][event/fetchParticipantProfiles] error", error?.message);
      return rejectWithValue(error.message || error.toString());
    }
    return data || [];
  },
);

export const commitEvent = createAsyncThunk(
  "event/commitEvent",
  async ({ userId, eventId, karmaCost }, { rejectWithValue, dispatch, getState }) => {
    // Get current karma from state
    const currentKarma = getState().auth.karmaPoints || 0;
    
    // Check if user has enough karma
    if (currentKarma < karmaCost) {
      return rejectWithValue("Not enough Karma points to commit to this event.");
    }

    // Deduct karma first
    dispatch(updateKarma(currentKarma - karmaCost));

    const userName = getState().auth.user?.username || "";

    // Then commit to event
    const { data, error } = await rsvpEvent({
      userId,
      eventId,
      status: "committed",
      userName,
    });
    
    if (error) {
      // Rollback karma if commit fails
      dispatch(updateKarma(currentKarma));
      return rejectWithValue(error.message || error.toString());
    }
    
    return { ...data, karmaSpent: karmaCost };
  },
);

export const attendEventWithLocation = createAsyncThunk(
  "event/attendEventWithLocation",
  async ({ userId, eventId }, { rejectWithValue, dispatch, getState }) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return rejectWithValue("Location permission is required to check in.");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const userLat = location.coords.latitude;
    const userLng = location.coords.longitude;

    const { data, error } = await checkInToEvent(
      {
        userId,
        eventId,
        lat: userLat,
        lng: userLng,
      },
    );
    if (error) {
      return rejectWithValue(error.message || error.toString());
    }

    // Update RSVP status to attended
    await updateRsvpStatus({ userId, eventId, status: "attended" });

    // No karma reward for check-in (will implement later with photo upload)

    return data || true;
  },
);

export const createFriendEventThunk = createAsyncThunk(
  "event/createFriendEvent",
  async ({ eventPayload, invitedFriends = [] }, { rejectWithValue, getState }) => {
    const { data: eventData, error: eventError } = await createEvent(eventPayload);
    if (eventError) {
      return rejectWithValue(eventError.message || eventError.toString());
    }
    if (invitedFriends.length > 0 && eventData?.id) {
      const creatorName = getState().auth.user?.username || "";
      const { error: inviteError } = await createFriendEventInvites(
        eventData.id,
        invitedFriends,
        eventData.title || eventPayload.title,
        creatorName,
        eventPayload.creator_id,
      );
      if (inviteError) {
        console.log("[THUNK][event/createFriendEvent] invite creation error:", inviteError.message);
      }
    }
    if (eventData?.id && eventPayload?.creator_id) {
      const { error: creatorError } = await createCreatorRsvp(eventData.id, eventPayload.creator_id);
      if (creatorError) {
        console.log("[THUNK][event/createFriendEvent] creator RSVP error:", creatorError.message);
      }
    }
    return eventData || null;
  },
);

export const fetchPendingEventInvites = createAsyncThunk(
  "event/fetchPendingEventInvites",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getPendingEventInvites(userId);
    if (error) return rejectWithValue(error.message || error.toString());
    return data || [];
  },
);

export const fetchCommittedFriendEvents = createAsyncThunk(
  "event/fetchCommittedFriendEvents",
  async (userId, { rejectWithValue }) => {
    const { data, error } = await getCommittedFriendEvents(userId);
    if (error) return rejectWithValue(error.message || error.toString());
    return data || [];
  },
);

export const respondToFriendEventInviteThunk = createAsyncThunk(
  "event/respondToFriendEventInvite",
  async ({ userId, eventId, status }, { rejectWithValue }) => {
    const { data, error } = await respondToFriendEventInviteApi({ userId, eventId, status });
    if (error) return rejectWithValue(error.message || error.toString());
    return data || null;
  },
);

export const fetchFriendEventAttendeeCounts = createAsyncThunk(
  "event/fetchFriendEventAttendeeCounts",
  async (eventIds, { rejectWithValue }) => {
    const { data, error } = await getFriendEventAttendeeCounts(eventIds);
    if (error) return rejectWithValue(error.message || error.toString());
    return data || {};
  },
);

const eventSlice = createSlice({
  name: "event",
  initialState,
  reducers: {
    clearEvents: (state) => {
      state.events = [];
    },
    clearEventParticipants: (state) => {
      state.eventParticipants = {};
    },
    clearAllEventState: (state) => {
      state.events = [];
      state.liveStories = [];
      state.liveEvents = [];
      state.pastEvents = [];
      state.committedEvents = [];
      state.attendedEvents = [];
      state.eventRsvps = {};
      state.eventParticipants = {};
      state.pendingFriendEventInvites = [];
      state.committedFriendEvents = [];
      state.friendEventAttendeeCounts = {};
      state.status = "idle";
      state.checkInStatus = "idle";
      state.error = "";
      state.eventsLoaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.events = action.payload;
        state.eventsLoaded = true;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        state.eventsLoaded = true;
      })
      .addCase(fetchLiveStories.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLiveStories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.liveStories = action.payload;
      })
      .addCase(fetchLiveStories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchLiveEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLiveEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.liveEvents = action.payload;
      })
      .addCase(fetchLiveEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchPastEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPastEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pastEvents = action.payload;
      })
      .addCase(fetchPastEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchUserRsvps.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserRsvps.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Extract committed event IDs
        const committedIds = action.payload
          .filter((rsvp) => rsvp.status === "committed")
          .map((rsvp) => rsvp.event_id);
        state.committedEvents = committedIds;
      })
      .addCase(fetchUserRsvps.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchAttendedEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAttendedEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.attendedEvents = action.payload;
      })
      .addCase(fetchAttendedEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchEventRsvps.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEventRsvps.fulfilled, (state, action) => {
        state.status = "succeeded";
        const rsvps = action.payload;
        const grouped = {};
        rsvps.forEach((rsvp) => {
          const eventId = rsvp.event_id;
          if (!grouped[eventId]) {
            grouped[eventId] = [];
          }
          grouped[eventId].push(rsvp.user_id);
        });
        state.eventRsvps = grouped;
      })
      .addCase(fetchEventRsvps.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchEventAttendees.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEventAttendees.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(fetchEventAttendees.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchParticipantProfiles.fulfilled, (state, action) => {
        const profiles = action.payload;
        const profileMap = {};
        profiles.forEach((profile) => {
          profileMap[profile.id] = profile;
        });
        state.eventParticipants = profileMap;
      })
      .addCase(commitEvent.pending, (state) => {
        state.checkInStatus = "loading";
        state.error = null;
      })
      .addCase(commitEvent.fulfilled, (state, action) => {
        state.checkInStatus = "succeeded";
        // Only add if API returned valid data and event not already committed
        if (action.payload && action.meta.arg.eventId) {
          const eventId = action.meta.arg.eventId;
          if (!state.committedEvents.includes(eventId)) {
            state.committedEvents.push(eventId);
          }
        }
      })
      .addCase(commitEvent.rejected, (state, action) => {
        state.checkInStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(attendEventWithLocation.pending, (state) => {
        state.checkInStatus = "loading";
        state.error = null;
      })
      .addCase(attendEventWithLocation.fulfilled, (state, action) => {
        state.checkInStatus = "succeeded";
        const eventId = action.meta.arg.eventId;
        if (eventId) {
          state.committedEvents = state.committedEvents.filter(id => id !== eventId);
          const existingAttended = state.attendedEvents.find(a => a.event_id === eventId || a === eventId);
          if (!existingAttended) {
            state.attendedEvents.push({ event_id: eventId, status: "attended" });
          }
        }
      })
      .addCase(attendEventWithLocation.rejected, (state, action) => {
        state.checkInStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createFriendEventThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createFriendEventThunk.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createFriendEventThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchPendingEventInvites.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPendingEventInvites.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pendingFriendEventInvites = action.payload;
      })
      .addCase(fetchPendingEventInvites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchCommittedFriendEvents.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCommittedFriendEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.committedFriendEvents = action.payload;
      })
      .addCase(fetchCommittedFriendEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(respondToFriendEventInviteThunk.fulfilled, (state, action) => {
        const updatedRsvp = action.payload;
        if (updatedRsvp?.event_id) {
          state.pendingFriendEventInvites = state.pendingFriendEventInvites.filter(
            invite => invite.event_id !== updatedRsvp.event_id
          );
        }
      })
      .addCase(fetchFriendEventAttendeeCounts.fulfilled, (state, action) => {
        state.friendEventAttendeeCounts = action.payload;
      });
  },
});

export const { clearEvents, clearEventParticipants, clearAllEventState } = eventSlice.actions;
export default eventSlice.reducer;
