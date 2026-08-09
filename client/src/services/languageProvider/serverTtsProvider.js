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
//
// Only one clip plays at a time: `currentAudio` tracks whatever's
// currently playing, and every new speak() call stops it first. Without
// this, two speak() calls close together (a fast double-click, or a
// second request landing while the first is still playing) would create
// two separate Audio elements playing simultaneously, overlapping audio.
// stopSpeaking() is also exposed so callers can cancel playback outright,
// e.g. when a chat panel closes mid-sentence.

import { api } from "../api";
import { webSpeechProvider } from "./webSpeechProvider";

let currentAudio = null;

function stopCurrent() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export const serverTtsProvider = {
  async speak(text, lang) {
    stopCurrent(); // never let two clips overlap
    const blob = await api.synthesizeSpeech(text, lang);
    const url = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (currentAudio === audio) currentAudio = null;
        reject(new Error("audio playback failed"));
      };
      audio.play().catch(reject);
    });
  },

  async listen(lang) {
    return webSpeechProvider.listen(lang);
  },

  stopSpeaking() {
    stopCurrent();
  },
};
