// services/languageProvider/bhashiniProvider.js
//
// Routes speak/listen through Bhashini's APIs instead of the browser.
// Wire in the real pipeline/inference endpoints once a Bhashini API key is
// provided; until then this throws so the caller's existing fallback
// (see index.js) degrades gracefully rather than silently doing nothing.

const API_KEY = import.meta.env.VITE_BHASHINI_API_KEY;

export const bhashiniProvider = {
  async speak(text, lang) {
    if (!API_KEY) throw new Error("VITE_BHASHINI_API_KEY not set");
    // TODO: call Bhashini's TTS pipeline endpoint with { text, lang, API_KEY }
    // and play back the returned audio. Left unimplemented until a key and
    // pipeline id are available to test against.
    throw new Error("Bhashini TTS not yet wired up");
  },

  async listen(lang) {
    if (!API_KEY) throw new Error("VITE_BHASHINI_API_KEY not set");
    // TODO: call Bhashini's ASR pipeline endpoint, streaming mic audio, and
    // return the transcript.
    throw new Error("Bhashini STT not yet wired up");
  },
};
