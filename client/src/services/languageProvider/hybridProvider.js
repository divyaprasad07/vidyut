// services/languageProvider/hybridProvider.js
//
// espeak-ng (serverTtsProvider) is 100% reliable but its Indic-language
// voices use a fairly basic phoneme model that can sound like an English
// speaker's approximation of the language rather than a native voice.
// Modern browsers often ship genuinely better, more natural cloud-backed
// voices for Hindi and other Indian languages, when the OS/browser
// actually has one installed. This provider prefers that better voice
// when a real match exists, and only falls back to espeak-ng when it
// doesn't, rather than either always using the possibly-robotic offline
// voice or (the original bug) blindly trusting the browser and silently
// getting English when no matching voice was installed. hasNativeVoice()
// checks the browser's actual voice list first, so that trust is earned,
// not assumed.

import { webSpeechProvider, hasNativeVoice } from "./webSpeechProvider";
import { serverTtsProvider } from "./serverTtsProvider";

export const hybridProvider = {
  async speak(text, lang) {
    const browserHasIt = await hasNativeVoice(lang);
    if (browserHasIt) {
      try {
        return await webSpeechProvider.speak(text, lang);
      } catch (err) {
        console.warn("Browser voice was detected but failed to play, falling back to espeak-ng:", err);
        // fall through to the espeak-ng path below
      }
    }
    return serverTtsProvider.speak(text, lang);
  },

  async listen(lang) {
    return webSpeechProvider.listen(lang);
  },

  stopSpeaking() {
    webSpeechProvider.stopSpeaking();
    serverTtsProvider.stopSpeaking();
  },
};
