import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  userData: null,
  token: null,
  karmaPoints: 100,

  // NEW: State to track which tribe's daily spark is answered
  answeredTribeSparks: [],

  // NEW: Dummy backend data for Today's Sparks based on Tribes
  todaysSparks: [
    {
      id: "ts1",
      tribe: "FITNESS",
      question: "What is your current fitness goal?",
    },
    { id: "ts2", tribe: "NIGHTLIFE", question: "Best late-night food spot?" },
    { id: "ts3", tribe: "TECH", question: "Which JS framework is overhyped?" },
    {
      id: "ts4",
      tribe: "GENERAL",
      question: "What song is stuck in your head?",
    },
  ],

  upcomingPlans: [
    {
      id: "1",
      title: "Taco Tuesday",
      time: "12:00 - 5:00 PM",
      location: "Downtown",
      participants: 3,
      karma: 6,
      committed: false,
    },
    {
      id: "2",
      title: "Saturday Hiking",
      time: "08:00 AM",
      location: "Canyon Trail",
      participants: 5,
      karma: 8,
      committed: false,
    },
  ],
  posts: [],
  activeTribeInvites: [
    {
      id: "1",
      title: "7 AM RUN AT MARINA",
      time: "12:00 - 5:00 PM",
      location: "Marina Bay",
      karma: 5,
    },
  ],
  joinedTribes: [],

  // Friends and Friend Events
  friends: [
    { id: "f1", name: "Alice", avatar: "A" },
    { id: "f2", name: "Bob", avatar: "B" },
    { id: "f3", name: "Charlie", avatar: "C" },
    { id: "f4", name: "Diana", avatar: "D" },
  ],
  upcomingFriendEvents: [
    {
      id: "fe1",
      title: "Movie Night",
      time: "8:00 PM",
      location: "Cinema",
      invitedFriends: ["f1", "f2"],
    },
  ],
  activeFriendEvents: [],

  // Pending Invites - users need to accept/decline these
  pendingInvites: [
    {
      id: "pi1",
      title: "Coffee Catchup",
      time: "Fri 6:30 PM",
      location: "Brew House",
      type: "friend",
      fromUser: "Alice",
      toUser: "You",
      friendId: "f1",
    },
    {
      id: "pi2",
      title: "TECH JAM",
      time: "Sat 8:00 PM",
      location: "Hack Hub",
      type: "tribe",
      tribe: "TECH",
      fromUser: "TECH Tribe",
      toUser: "You",
      timestamp: Date.now() + 86400000,
    },
  ],
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isLoggedIn = true;
      state.userData = action.payload.userData;
      state.token = action.payload.token;
    },
    // Mark a specific tribe's spark as answered
    answerTribeSpark: (state, action) => {
      const tribeName = action.payload;
      if (!state.answeredTribeSparks.includes(tribeName)) {
        state.answeredTribeSparks.push(tribeName);
      }
    },
    addNewPost: (state, action) => {
      state.posts = [action.payload, ...state.posts];
    },

    commitUpcomingPlan: (state, action) => {
      const { planId, cost } = action.payload;
      const planIndex = state.upcomingPlans.findIndex(
        (plan) => plan.id === planId,
      );
      if (planIndex === -1) return;
      const plan = state.upcomingPlans[planIndex];
      if (plan.committed) return;
      if (state.karmaPoints < cost) return;

      state.karmaPoints -= cost;
      state.upcomingPlans[planIndex] = {
        ...plan,
        committed: true,
      };
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.userData = null;
      state.token = null;
    },

    // <--- MAIN MAGIC IS HERE --->
    addTribeInvite: (state, action) => {
      const newEvent = action.payload;
      const currentTime = Date.now();

      // Agar event ka timestamp maujood hai aur wo future ka hai
      if (newEvent.timestamp && newEvent.timestamp > currentTime) {
        // Toh usko UPCOMING PLANS me daal do
        state.upcomingPlans = [newEvent, ...state.upcomingPlans];
      } else {
        // Agar aaj ka hai ya purana hai, toh ACTIVE TRIBES me daal do
        state.activeTribeInvites = [newEvent, ...state.activeTribeInvites];
      }
    },

    // <--- NEW SHIFTER LOGIC --->
    refreshEventStatus: (state) => {
      const currentTime = Date.now();

      // 1. Un plans ko dhundo jinka time aa chuka hai (past ho gaye hain ya abhi chal rahe hain)
      const plansToMove = state.upcomingPlans.filter(
        (plan) => plan.timestamp && plan.timestamp <= currentTime,
      );

      // 2. Upcoming array me se unko hata do (sirf future wale rehne do)
      state.upcomingPlans = state.upcomingPlans.filter(
        (plan) => !(plan.timestamp && plan.timestamp <= currentTime),
      );

      // 3. Nikale hue plans ko active me push kardo
      if (plansToMove.length > 0) {
        state.activeTribeInvites = [
          ...plansToMove,
          ...state.activeTribeInvites,
        ];
      }
    },

    joinTribeAction: (state, action) => {
      const tribe = action.payload;
      if (!state.joinedTribes.find((t) => t.id === tribe.id)) {
        state.joinedTribes.push(tribe);
      }
    },

    addFriendEvent: (state, action) => {
      const newEvent = action.payload;
      state.upcomingFriendEvents = [newEvent, ...state.upcomingFriendEvents];
    },

    // Pending Invite Management
    addPendingInvite: (state, action) => {
      const newInvite = action.payload;
      state.pendingInvites = [newInvite, ...state.pendingInvites];
    },

    acceptInvite: (state, action) => {
      const inviteId = action.payload;
      const invite = state.pendingInvites.find((inv) => inv.id === inviteId);
      if (invite) {
        // Remove from pending
        state.pendingInvites = state.pendingInvites.filter(
          (inv) => inv.id !== inviteId,
        );

        // Add to appropriate events based on type
        if (invite.type === "friend") {
          state.upcomingFriendEvents = [invite, ...state.upcomingFriendEvents];
        } else if (invite.type === "tribe") {
          // Add to upcoming plans for tribe events
          state.upcomingPlans = [invite, ...state.upcomingPlans];
        }
      }
    },

    declineInvite: (state, action) => {
      const inviteId = action.payload;
      state.pendingInvites = state.pendingInvites.filter(
        (inv) => inv.id !== inviteId,
      );
    },
  },
});

export const {
  loginSuccess,
  logout,
  addNewPost,
  answerTribeSpark,
  commitUpcomingPlan,
  addTribeInvite,
  refreshEventStatus,
  joinTribeAction,
  addFriendEvent,
  addPendingInvite,
  acceptInvite,
  declineInvite,
} = userSlice.actions;

export default userSlice.reducer;
