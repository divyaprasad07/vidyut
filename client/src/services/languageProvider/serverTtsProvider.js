// services/languageProvider/serverTtsProvider.js
//
// Fixes the bug where browser speechSynthesis silently falls back to an
// English voice for languages that have no voice pack installed on the
// student's machine, with no error thrown, so the old code had no way to
// detect or report it. This routes speech synthesis through the server's
// espeak-ng endpoint instead, which ships its own voice data for all 6
// languages, so the result doesn't depend on what's installed locally.
//
// Speech RECOGNITION (listen) has no equivalent free, no-API-key,
// server-side option worth building for a hackathon, so this delegates
// listen() to the browser's Web Speech API, same as before, that part
// wasn't broken.

import { api } from "../api";
import { webSpeechProvider } from "./webSpeechProvider";

export const serverTtsProvider = {
  async speak(text, lang) {
    const blob = await api.synthesizeSpeech(text, lang);
    const url = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("audio playback failed"));
      };
      audio.play().catch(reject);
    });
  },

  async listen(lang) {
    return webSpeechProvider.listen(lang);
  },
};
