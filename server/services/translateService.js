// services/translateService.js
//
// Free, no-API-key translation via MyMemory (api.mymemory.translated.net).
// Used so a chatbot reply (always in English, see chatService.js) can be
// read aloud in whichever language the student wants to listen in —
// text-to-speech only speaks text as given, it doesn't translate, so this
// step is genuinely needed, not decorative. Capped and cached per server
// run since MyMemory's free tier has a daily character limit (5,000/day
// per IP), which is plenty for occasional per-message use in a demo.

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const MAX_TEXT_LENGTH = 500;
const cache = new Map(); // `${sourceLang}|${targetLang}|${text}` -> translated text, avoids re-translating repeats

export async function translateText(text, targetLang, sourceLang = "en") {
  if (!text || !text.trim()) throw new Error("no text provided");
  if (text.length > MAX_TEXT_LENGTH) throw new Error("text too long");
  if (sourceLang === targetLang) return text; // nothing to do

  const cacheKey = `${sourceLang}|${targetLang}|${text}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const params = new URLSearchParams({ q: text, langpair: `${sourceLang}|${targetLang}` });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${MYMEMORY_URL}?${params.toString()}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`MyMemory API error ${res.status}`);
    const data = await res.json();
    const translated = data.responseData?.translatedText;
    if (!translated) throw new Error("empty translation response");
    cache.set(cacheKey, translated);
    return translated;
  } finally {
    clearTimeout(timeout);
  }
}
