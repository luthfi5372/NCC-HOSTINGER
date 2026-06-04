"use client";

import { useEffect } from "react";

export default function SessionManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if the current browser tab session is active
    const sessionActive = sessionStorage.getItem("ncc_session_active");
    if (!sessionActive) {
      const performSilentLogout = async () => {
        try {
          // 1. Sign out of Supabase to wipe all client auth cookies/tokens
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          await supabase.auth.signOut();

          // 2. Clear local storage / session storage tokens
          sessionStorage.removeItem("ncc_local_session");
          localStorage.removeItem("ncc_local_session");

          // 3. Mark the tab session as initialized
          sessionStorage.setItem("ncc_session_active", "true");

          // 4. Force reload to clean any active state
          window.location.reload();
        } catch (e) {
          console.error("Silent session clean failed:", e);
          sessionStorage.setItem("ncc_session_active", "true");
        }
      };
      performSilentLogout();
    }
  }, []);

  return null;
}
