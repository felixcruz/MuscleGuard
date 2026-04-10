"use client";

import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook to get a stable Supabase client reference across renders
 * Prevents recreating client on every render
 */
export function useSupabaseClient() {
  const clientRef = useRef(createClient());
  return clientRef.current;
}
