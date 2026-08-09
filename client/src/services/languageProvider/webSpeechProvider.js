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

export const webSpeechProvider = {
  async speak(text, lang) {
    if (!("speechSynthesis" in window)) {
      throw new Error("speechSynthesis not supported in this browser");
    }
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
};
