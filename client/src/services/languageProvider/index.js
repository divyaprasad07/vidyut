// services/languageProvider/index.js
//
// TIER 2 — Vernacular voice interaction.
// Single interface: speak(text, lang) and listen(lang). Everything else in
// the app calls only these two functions, never a provider SDK directly,
// so PROVIDER below is the one line that needs to change to swap the
// active provider.
//
// Default is "server-tts" (espeak-ng running on our own server, free, no
// API key), not the browser's speechSynthesis, because browser TTS
// silently falls back to an English voice for any language that has no
// voice pack installed on that specific machine, with no error thrown, so
// students could pick Hindi/Bengali/etc. and just hear English with no
// indication anything was wrong. espeak-ng ships its own voice data for
// all 6 supported languages, so it doesn't depend on what's installed
// locally. Set VITE_LANGUAGE_PROVIDER=webspeech to go back to pure
// browser TTS (e.g. if the server can't run espeak-ng for some reason),
// or =bhashini once that pipeline is wired up with a real API key.

import { webSpeechProvider } from "./webSpeechProvider";
import { serverTtsProvider } from "./serverTtsProvider";
import { bhashiniProvider } from "./bhashiniProvider";

const REQUESTED = import.meta.env.VITE_LANGUAGE_PROVIDER;
const PROVIDER = ["webspeech", "server-tts", "bhashini"].includes(REQUESTED) ? REQUESTED : "server-tts";

const providers = {
  webspeech: webSpeechProvider,
  "server-tts": serverTtsProvider,
  bhashini: bhashiniProvider,
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

export const activeProviderName = PROVIDER;
