import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase/client";
import { clearData, loadDemo, loadForUser } from "@/lib/finance/store";

export type SessionStatus = "loading" | "signedOut" | "signedIn" | "demo";

export interface SessionState {
  status: SessionStatus;
  userId?: string | undefined;
  email?: string | undefined;
  error?: string | undefined;
}

const SERVER: SessionState = { status: "loading" };
let state: SessionState = SERVER;
let started = false;
const listeners = new Set<() => void>();

function set(next: SessionState) {
  state = next;
  listeners.forEach((l) => l());
}

function apply(session: Session | null) {
  if (!session) {
    if (state.status === "demo") return;
    if (state.status !== "signedOut") {
      clearData();
      set({ status: "signedOut" });
    }
    return;
  }
  const { id, email } = session.user;
  if (state.status === "signedIn" && state.userId === id) return;
  set({ status: "signedIn", userId: id, email });
  void loadForUser(id, email);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  let sb;
  try {
    sb = getSupabase();
  } catch (e) {
    set({ status: "signedOut", error: e instanceof Error ? e.message : String(e) });
    return;
  }
  sb.auth.getSession().then(({ data }) => apply(data.session));
  // Supabase recomenda não chamar o client dentro do callback; adia para o próximo tick.
  sb.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => apply(session), 0);
  });
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

export const authActions = {
  enterDemo() {
    loadDemo();
    set({ status: "demo" });
  },
  async signOut() {
    if (state.status === "demo") {
      clearData();
      set({ status: "signedOut" });
      return;
    }
    await getSupabase().auth.signOut();
    clearData();
    set({ status: "signedOut" });
  },
};
