"use client";

import { useSyncExternalStore } from "react";
import { initialState, type DemoState } from "./model";

const KEY = "revisi-halal-demo-v1";
let cached = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function isState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const state = value as DemoState;
  return (
    state.schema === 1 &&
    Array.isArray(state.cases) &&
    Array.isArray(state.tasks) &&
    Array.isArray(state.contacts) &&
    Array.isArray(state.history) &&
    typeof state.drafts === "object" &&
    state.drafts !== null
  );
}
function getSnapshot() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const stored: unknown = JSON.parse(raw);
        if (isState(stored)) cached = stored;
      }
    } catch {
      /* Unavailable storage keeps the read-only initial demo usable. */
    }
  }
  return cached;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    loaded = false;
    cached = initialState;
    getSnapshot();
    listeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}
export function useDemo() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialState);
}
const subscribeReady = () => () => {};
export function useDemoReady() {
  return useSyncExternalStore(
    subscribeReady,
    () => true,
    () => false,
  );
}

// shortcut: browser-only demo state; replace with authenticated server mutations before using real data.
export function updateDemo(change: (state: DemoState) => DemoState) {
  const next = change(getSnapshot());
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error(
      "Penyimpanan browser tidak tersedia. Izinkan penyimpanan lokal lalu coba lagi; isian Anda tetap tersedia.",
    );
  }
  cached = next;
  listeners.forEach((listener) => listener());
}
export function resetDemo() {
  updateDemo(() => structuredClone(initialState));
}
