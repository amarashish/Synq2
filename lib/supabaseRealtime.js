import { supabase } from "../constants/supabase";

let friendshipsChannel = null;
let chatRequestsChannel = null;

export const subscribeToFriendRequests = (userId, onFriendRequestUpdate) => {
  if (!userId) return () => {};

  if (friendshipsChannel) {
    supabase.removeChannel(friendshipsChannel);
  }
  if (chatRequestsChannel) {
    supabase.removeChannel(chatRequestsChannel);
  }

  friendshipsChannel = supabase
    .channel(`friendships-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `user2_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[REALTIME] New friend request:', payload.new);
        onFriendRequestUpdate({ type: 'new_request', data: payload.new });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friendships',
        filter: `user1_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[REALTIME] Friendship updated (accepted):', payload.new);
        onFriendRequestUpdate({ type: 'request_accepted', data: payload.new });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friendships',
        filter: `user2_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[REALTIME] Friendship updated:', payload.new);
        onFriendRequestUpdate({ type: 'request_updated', data: payload.new });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'friendships',
      },
      (payload) => {
        console.log('[REALTIME] Friendship deleted (unfriend):', payload.old);
        onFriendRequestUpdate({ type: 'unfriend', data: payload.old });
      }
    )
    .subscribe();

  chatRequestsChannel = supabase
    .channel(`chat-requests-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_requests',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[REALTIME] New chat request:', payload.new);
        onFriendRequestUpdate({ type: 'chat_request', data: payload.new });
      }
    )
    .subscribe();

  return () => {
    if (friendshipsChannel) supabase.removeChannel(friendshipsChannel);
    if (chatRequestsChannel) supabase.removeChannel(chatRequestsChannel);
    friendshipsChannel = null;
    chatRequestsChannel = null;
  };
};

export const unsubscribeFromFriendRequests = () => {
  if (friendshipsChannel) {
    supabase.removeChannel(friendshipsChannel);
    friendshipsChannel = null;
  }
  if (chatRequestsChannel) {
    supabase.removeChannel(chatRequestsChannel);
    chatRequestsChannel = null;
  }
};

let eventRsvpsChannel = null;

export const subscribeToFriendEventInvites = (userId, onInviteUpdate) => {
  if (!userId) return () => {};
  if (eventRsvpsChannel) {
    supabase.removeChannel(eventRsvpsChannel);
  }
  eventRsvpsChannel = supabase
    .channel(`event-rsvps-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'event_rsvps', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log('[REALTIME] New event invite:', payload.new);
        if (payload.new.status === 'invited') {
          onInviteUpdate({ type: 'new_event_invite', data: payload.new });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'event_rsvps', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log('[REALTIME] Event RSVP updated:', payload.new);
        onInviteUpdate({ type: 'event_invite_updated', data: payload.new });
      }
    )
    .subscribe();
  return () => {
    if (eventRsvpsChannel) supabase.removeChannel(eventRsvpsChannel);
    eventRsvpsChannel = null;
  };
};

// ─── Typing Indicator (Broadcast) ───

let typingChannels = {};

export const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join("-");
};

export const subscribeToTyping = (conversationId, onTyping) => {
  if (typingChannels[conversationId]) return typingChannels[conversationId];

  const channel = supabase.channel(`typing-${conversationId}`, {
    config: { broadcast: { self: false, ack: false } },
  })
    .on("broadcast", { event: "typing" }, (payload) => {
      onTyping(payload.payload);
    })
    .subscribe();

  typingChannels[conversationId] = channel;
  return channel;
};

export const broadcastTyping = (conversationId, userId) => {
  const channel = typingChannels[conversationId];
  if (!channel) return;
  channel.send({
    type: "broadcast",
    event: "typing",
    payload: { userId },
  });
};

export const unsubscribeFromTyping = (conversationId) => {
  if (typingChannels[conversationId]) {
    supabase.removeChannel(typingChannels[conversationId]);
    delete typingChannels[conversationId];
  }
};

// ─── Online Presence (Broadcast heartbeat) ───

let presenceChannels = {};

export const trackOnlinePresence = async (userId) => {
  if (presenceChannels[userId]) return presenceChannels[userId];

  const channel = supabase.channel(`presence-${userId}`)
    .on("presence", { event: "sync" }, () => {})
    .on("presence", { event: "join" }, () => {})
    .on("presence", { event: "leave" }, () => {});

  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ user_id: userId, online_at: new Date().toISOString() });
    }
  });

  presenceChannels[userId] = channel;
  return channel;
};

export const subscribeToFriendPresence = (friendId, onOnlineStatus) => {
  const channel = supabase.channel(`presence-${friendId}`)
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const online = Object.keys(state).length > 0;
      onOnlineStatus(online);
    })
    .subscribe();

  return channel;
};

export const untrackOnlinePresence = async (userId) => {
  if (presenceChannels[userId]) {
    try { await presenceChannels[userId].untrack(); } catch (e) {}
    supabase.removeChannel(presenceChannels[userId]);
    delete presenceChannels[userId];
  }
};