import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import chatReducer from "./chatSlice";
import tribeReducer from "./tribeSlice";
import sparkReducer from "./sparkSlice";
import eventReducer from "./eventSlice";
import friendReducer from "./friendSlice";
import profileReducer from "./profileSlice";
import themeReducer from "./themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    tribe: tribeReducer,
    spark: sparkReducer,
    event: eventReducer,
    friend: friendReducer,
    profile: profileReducer,
    theme: themeReducer,
  },
});
