// services/ttsService.js
//
// TIER 2 — Vernacular voice interaction, text-to-speech.
//
// Why this exists instead of relying on the browser's speechSynthesis:
// browser TTS quality and language coverage depends entirely on which
// voice packs happen to be installed on that specific machine. In
// practice that means "select Hindi" silently falls back to whatever
// default English voice is installed, with no error, since
// speechSynthesis doesn't fail loudly when a language has no matching
// voice, it just picks the closest one it has. That's exactly the bug
// this replaces: espeak-ng runs on the server, ships its own voice data
// for all 6 supported languages, and is completely free with no API key,
// so every student hears the right language regardless of their browser
// or OS.

import { spawn } from "child_process";

const ESPEAK_LANG_MAP = {
  en: "en-us",
  hi: "hi",
  bn: "bn",
  mr: "mr",
  ta: "ta",
  te: "te",
};

const MAX_TEXT_LENGTH = 600; // question text is short; this is a generous cap against abuse

let availabilityChecked = false;
let isAvailable = false;

/** Check once (not per-request) whether espeak-ng is actually on PATH. */
export function checkTtsAvailability() {
  return new Promise((resolve) => {
    if (availabilityChecked) return resolve(isAvailable);
    const proc = spawn("espeak-ng", ["--version"]);
    proc.on("error", () => {
      availabilityChecked = true;
      isAvailable = false;
      resolve(false);
    });
    proc.on("close", (code) => {
      availabilityChecked = true;
      isAvailable = code === 0;
      resolve(isAvailable);
    });
  });
}

/**
 * Synthesize `text` in `lang` and resolve with a WAV audio Buffer.
 * Rejects with a clear message on bad input or if espeak-ng isn't
 * available, so the route can turn that into a proper HTTP error rather
 * than hanging.
 */
export function synthesizeSpeech(text, lang) {
  return new Promise((resolve, reject) => {
    if (!text || !text.trim()) return reject(new Error("no text provided"));
    if (text.length > MAX_TEXT_LENGTH) return reject(new Error("text too long"));
    const espeakLang = ESPEAK_LANG_MAP[lang];
    if (!espeakLang) return reject(new Error(`unsupported language: ${lang}`));

    // Args array, not a shell string, so there's no shell-injection risk
    // from question text containing quotes, semicolons, etc.
    const proc = spawn("espeak-ng", ["-v", espeakLang, "-s", "160", "--stdout"]);

    const chunks = [];
    let stderr = "";
    proc.stdout.on("data", (chunk) => chunks.push(chunk));
    proc.stderr.on("data", (chunk) => (stderr += chunk));
    proc.on("error", (err) => reject(err)); // e.g. ENOENT if not installed
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`espeak-ng exited ${code}: ${stderr}`));
      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) return reject(new Error("espeak-ng produced no audio"));
      resolve(buffer);
    });

    proc.stdin.write(text, "utf-8");
    proc.stdin.end();
  });
}

export const SUPPORTED_TTS_LANGUAGES = Object.keys(ESPEAK_LANG_MAP);
