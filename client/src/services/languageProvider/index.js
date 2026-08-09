// services/languageProvider/index.js
//
// TIER 2 — Vernacular voice interaction.
// Single interface: speak(text, lang) and listen(lang). Everything else in
// the app calls only these two functions, never a provider SDK directly,
// so PROVIDER below is the one line that needs to change to swap the
// active provider.
//
// Default is "hybrid": prefer the browser's own voice for a language when
// one is genuinely installed (often much more natural-sounding, e.g.
// Edge's cloud voices), and fall back to espeak-ng (server-side, always
// works, no API key, but a more robotic/accented voice for Indic
// languages) when it isn't. This replaced a plain "always use espeak-ng"
// default: that was fully reliable but every language sounded the same
// robotic way, no better than it had to be when a good browser voice was
// actually available. "hybrid" keeps the reliability (checks the real
// voice list before trusting the browser, so it can't silently fall back
// to English the way plain browser TTS used to) while getting the better
// voice whenever the machine has one. Set VITE_LANGUAGE_PROVIDER=webspeech
// for pure browser TTS, =server-tts to always force espeak-ng, or
// =bhashini once that pipeline is wired up with a real API key.

import { webSpeechProvider } from "./webSpeechProvider";
import { serverTtsProvider } from "./serverTtsProvider";
import { hybridProvider } from "./hybridProvider";
import { bhashiniProvider } from "./bhashiniProvider";

const REQUESTED = import.meta.env.VITE_LANGUAGE_PROVIDER;
const PROVIDER = ["webspeech", "server-tts", "bhashini", "hybrid"].includes(REQUESTED) ? REQUESTED : "hybrid";

const providers = {
  webspeech: webSpeechProvider,
  "server-tts": serverTtsProvider,
  bhashini: bhashiniProvider,
  hybrid: hybridProvider,
};

const active = providers[PROVIDER];

/**
 * Speak `text` aloud in `lang` (a BCP-47-ish tag: en, hi, bn, mr, ta, te).
 * Resolves to true on success, false on failure, never throws, so callers
 * can show a visible fallback message instead of failing silently.
 */
export async function speak(text, lang) {
  try {
    await active.speak(text, lang);
    return true;
  } catch (err) {
    console.warn(`speak() failed via ${PROVIDER}, voice output unavailable this session:`, err);
    return false;
  }
}

/** Listen for speech in `lang`, resolving to the transcribed text. */
export async function listen(lang) {
  try {
    return await active.listen(lang);
  } catch (err) {
    console.warn(`listen() failed via ${PROVIDER}, voice input unavailable this session:`, err);
    return null;
  }
}

/** Stop whatever's currently being spoken, if anything. Never throws. */
export function stopSpeaking() {
  try {
    active.stopSpeaking?.();
  } catch (err) {
    console.warn(`stopSpeaking() failed via ${PROVIDER}:`, err);
  }
}

export const activeProviderName = PROVIDER;
