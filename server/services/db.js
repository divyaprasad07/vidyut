// services/db.js
//
// Thin data-access layer. Every route/controller in this app talks to THIS
// file only, never to Firestore or a local file directly. That means
// switching from the local JSON store to real Firebase Firestore is a
// one-file change (flip USE_FIREBASE + provide serviceAccount.json), not a
// rewrite of the routes.
//
// Why a local store exists at all: this build environment has no network
// path to Firebase, so the local JSON store lets the adaptive engine,
// seed data, and route logic be written and verified end-to-end here.
// On your machine, set USE_FIREBASE=true and drop in a service account key
// and every call below routes to real Firestore instead, no other code
// changes required.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data", "db.json");

const USE_FIREBASE = process.env.USE_FIREBASE === "true";

const COLLECTIONS = [
  "students",
  "teachers",
  "questions",
  "attempts",
  "ratings_history",
  "badges",
  "videos",
  "dice_challenges",
];

function emptyStore() {
  const store = {};
  for (const c of COLLECTIONS) store[c] = {};
  return store;
}

function loadStore() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(emptyStore(), null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

let firestore = null;
if (USE_FIREBASE) {
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "serviceAccount.json"), "utf-8")
  );
  initializeApp({ credential: cert(serviceAccount) });
  firestore = getFirestore();
}

/** Get every document in a collection as an array of {id, ...fields}. */
export async function getCollection(collection) {
  if (USE_FIREBASE) {
    const snap = await firestore.collection(collection).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const store = loadStore();
  return Object.entries(store[collection] || {}).map(([id, data]) => ({
    id,
    ...data,
  }));
}

/** Get one document by id, or null if it doesn't exist. */
export async function getDoc(collection, id) {
  if (USE_FIREBASE) {
    const snap = await firestore.collection(collection).doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }
  const store = loadStore();
  const doc = store[collection]?.[id];
  return doc ? { id, ...doc } : null;
}

/** Create or fully overwrite a document. */
export async function setDoc(collection, id, data) {
  if (USE_FIREBASE) {
    await firestore.collection(collection).doc(id).set(data);
    return { id, ...data };
  }
  const store = loadStore();
  store[collection] = store[collection] || {};
  store[collection][id] = data;
  saveStore(store);
  return { id, ...data };
}

/** Shallow-merge a patch into an existing document. */
export async function updateDoc(collection, id, patch) {
  if (USE_FIREBASE) {
    await firestore.collection(collection).doc(id).update(patch);
    const snap = await firestore.collection(collection).doc(id).get();
    return { id: snap.id, ...snap.data() };
  }
  const store = loadStore();
  store[collection] = store[collection] || {};
  store[collection][id] = { ...(store[collection][id] || {}), ...patch };
  saveStore(store);
  return { id, ...store[collection][id] };
}

/** Delete a document. No-op if it doesn't already exist. */
export async function deleteDoc(collection, id) {
  if (USE_FIREBASE) {
    await firestore.collection(collection).doc(id).delete();
    return;
  }
  const store = loadStore();
  if (store[collection]) delete store[collection][id];
  saveStore(store);
}

/** Add a document with an auto-generated id. Returns the new id. */
export async function addDoc(collection, data) {
  const id =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await setDoc(collection, id, data);
  return id;
}

/**
 * Query a collection with a JS predicate. This is intentionally simple
 * (full collection scan) since the seed dataset is small (15-20 students).
 * For real Firestore, swap the body of this function for proper `.where()`
 * chains once query shapes stabilize; predicate-based filtering was chosen
 * here specifically so that swap doesn't touch any calling code's contract.
 */
export async function queryCollection(collection, predicate) {
  const all = await getCollection(collection);
  return predicate ? all.filter(predicate) : all;
}

export const dbMode = USE_FIREBASE ? "firebase" : "local-json";
