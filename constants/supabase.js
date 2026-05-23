import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://hqezfilsalbnutbkmyyb.supabase.co";
export const SUPABASE_ANON_KEY =
  "sb_publishable_RANRNif_5ES6pLF2Jm4CwQ_p35LXXLj";

// Ab Supabase ko pata hai ki login token kahan save karna hai
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
