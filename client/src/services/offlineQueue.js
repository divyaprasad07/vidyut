// services/offlineQueue.js
//
// TIER 1 — Offline-first quiz taking.
// While online, quiz submissions go straight to POST /api/attempts.
// While offline, they're written to an IndexedDB queue instead, and the
// UI shows a visible "Offline, X answers queued" indicator (see
// hooks/useOfflineQueue.js). On reconnect, flushQueue() pushes each
// queued attempt to the server in order and applies the resulting Elo
// rating update, exactly as if it had been submitted live.
//
// This intentionally does last-write-wins conflict resolution (queued
// attempts are replayed in the order they were recorded, no merge logic
// beyond that) — production-grade offline conflict resolution is Tier 3,
// explicitly out of scope for this build.

import { openDB } from "idb";
import { api } from "./api";

const DB_NAME = "vidyut-offline";
const STORE = "queued-attempts";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "localId", autoIncrement: true });
      }
    },
  });
}

/** Queue an attempt payload for later sync. Returns the local queue id. */
export async function queueAttempt(payload) {
  const db = await getDb();
  return db.add(STORE, { ...payload, queuedAt: new Date().toISOString() });
}

export async function getQueuedAttempts() {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function queueCount() {
  const db = await getDb();
  return db.count(STORE);
}

/**
 * Push every queued attempt to the server, in the order it was recorded.
 * A failure partway through (e.g. connection drops again mid-flush) stops
 * the flush and leaves the remaining items queued for next time — nothing
 * is dropped or double-counted, since successfully-synced items are only
 * removed after the server confirms them.
 */
export async function flushQueue(onProgress) {
  const db = await getDb();
  const all = await db.getAll(STORE);
  let synced = 0;
  for (const item of all) {
    const { localId, queuedAt, ...payload } = item;
    try {
      await api.submitAttempt(payload);
      await db.delete(STORE, localId);
      synced++;
      onProgress?.(synced, all.length);
    } catch (err) {
      // Stop here, remaining items stay queued for the next reconnect.
      console.warn("Offline queue flush stopped early:", err);
      break;
    }
  }
  return { synced, total: all.length };
}

/** Submit an attempt, going through the offline queue if the browser is offline. */
export async function submitAttemptOnlineOrQueued(payload) {
  if (!navigator.onLine) {
    await queueAttempt(payload);
    return { queued: true };
  }
  try {
    const result = await api.submitAttempt(payload);
    return { queued: false, result };
  } catch (err) {
    // Network looked up but the request still failed (flaky connection) —
    // fall back to queueing rather than losing the attempt.
    await queueAttempt(payload);
    return { queued: true };
  }
}
