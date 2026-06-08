"use client";

import { useEffect } from "react";

export default function SessionManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Mark the current browser tab session as active
    sessionStorage.setItem("ncc_session_active", "true");
  }, []);

  return null;
}
