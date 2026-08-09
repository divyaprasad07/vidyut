// services/languageProvider/webSpeechProvider.js
//
// Default provider: browser Web Speech API for both TTS and STT.
// Language tags are mapped to the BCP-47 locales Web Speech expects.

const LOCALE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
};

// Resolves once the browser's voice list is actually populated. Some
// browsers return it synchronously, others only after the async
// `voiceschanged` event fires the first time, so this covers both rather
// than risking an empty list on the very first call.
function getVoicesAsync() {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve([]);
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) return resolve(existing);
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000); // in case the event never fires
  });
}

/**
 * True only if the browser has an actual voice matching this language,
 * not just "some voice exists". This is the check that was missing
 * originally: speechSynthesis.speak() never errors for an unmatched
 * language, it silently substitutes the closest voice it has (often
 * English), so the only reliable way to know a language is really
 * supported is to check the voice list directly first.
 */
export async function hasNativeVoice(lang) {
  const voices = await getVoicesAsync();
  const target = (LOCALE_MAP[lang] || lang).toLowerCase().slice(0, 2);
  return voices.some((v) => v.lang.toLowerCase().startsWith(target));
}

export const webSpeechProvider = {
  async speak(text, lang) {
    if (!("speechSynthesis" in window)) {
      throw new Error("speechSynthesis not supported in this browser");
    }
    window.speechSynthesis.cancel(); // clear any queued/playing utterance first, don't stack them up
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LOCALE_MAP[lang] || "en-IN";
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e.error);
      window.speechSynthesis.speak(utterance);
    });
  },

  async listen(lang) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error("SpeechRecognition not supported in this browser");
    }
    return new Promise((resolve, reject) => {
      const recognizer = new SpeechRecognition();
      recognizer.lang = LOCALE_MAP[lang] || "en-IN";
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
      recognizer.onresult = (event) => resolve(event.results[0][0].transcript);
      recognizer.onerror = (event) => reject(event.error);
      recognizer.start();
    });
  },

  stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  },
};
