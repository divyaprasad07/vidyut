// components/ChatWidget.jsx
//
// Deliberately small and self-contained: messages live only in this
// component's state (an array of {role, content}), nothing is persisted
// server-side or in any database collection, the server route is pure
// request/response. Closing the panel or reloading the page clears the
// conversation, which is fine for quick doubt-solving and keeps this
// feature genuinely light.
//
// Hidden on /quiz/* routes on purpose: leaving an always-on "ask AI"
// button available during an active quiz would be a direct way to get
// answers, which would undermine the quiz-integrity system elsewhere in
// this app. It's available on every other screen.
//
// Voice: students can ask by voice in any of the 6 supported languages
// (browser speech recognition fills the input box, doesn't auto-send, so
// they can review/edit a misheard transcript first). The chatbot always
// replies in English (enforced in the system prompt server-side), and
// each reply has a speaker button that translates it into whichever
// language the student is currently set to and reads it aloud, so a
// student who asked in Hindi can ask in Hindi and listen back in Hindi
// even though the text on screen stays English.

import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import { speak, listen, stopSpeaking } from "../services/languageProvider";

const MAX_MESSAGE_LENGTH = 500;
const VOICE_LANGUAGES = { en: "English", hi: "Hindi", bn: "Bengali", mr: "Marathi", ta: "Tamil", te: "Telugu" };
const HAS_STT = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export function ChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // [{role: 'user'|'assistant', content}]
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en");
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null); // which message is currently being read aloud
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  // This component stays mounted even when it renders nothing (see the
  // `hidden` check below), it doesn't unmount just because the route
  // changed. So if a reply were mid-sentence when a student navigated to
  // a quiz, the audio would otherwise keep playing invisibly in the
  // background. Same for the panel being closed with the X button, that
  // doesn't unmount anything either. Both cases need an explicit stop.
  const hidden = location.pathname.startsWith("/quiz/") || location.pathname.startsWith("/teacher");
  useEffect(() => {
    if (hidden) {
      stopSpeaking();
      setSpeakingIndex(null);
    }
  }, [hidden]);

  // Belt and suspenders: also stop on a genuine unmount, e.g. if this
  // component's mount point in App.jsx ever changes in the future.
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  // Hidden during an active quiz (see note above) and on teacher/admin
  // screens, since this is a student-facing tool, not something that
  // belongs cluttering the teacher dashboard.
  if (hidden) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setUnavailable(false);
    const next = [...messages, { role: "user", content: text.slice(0, MAX_MESSAGE_LENGTH) }];
    setMessages(next);
    setSending(true);
    try {
      const { reply } = await api.chat(text, messages);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      console.warn("Chat request failed:", err.message);
      const isUnconfigured = /not configured/i.test(err.message || "");
      setUnavailable(isUnconfigured);
      setMessages([
        ...next,
        {
          role: "assistant",
          content: isUnconfigured
            ? "The study helper isn't set up yet, ask your teacher about it."
            : "Sorry, I couldn't answer that just now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const listenForQuestion = async () => {
    if (listening) return;
    setListening(true);
    const transcript = await listen(voiceLang);
    if (transcript) setInput(transcript.slice(0, MAX_MESSAGE_LENGTH));
    setListening(false);
  };

  const speakReply = async (content, index) => {
    if (speakingIndex != null) return;
    setSpeakingIndex(index);
    try {
      let toSpeak = content;
      if (voiceLang !== "en") {
        try {
          const { translatedText } = await api.translate(content, voiceLang, "en");
          toSpeak = translatedText;
        } catch (err) {
          console.warn("Translating chat reply failed, speaking the English text instead:", err.message);
          // fall back to speaking the original English text rather than staying silent
        }
      }
      await speak(toSpeak, voiceLang);
    } finally {
      setSpeakingIndex(null);
    }
  };

  const toggleOpen = () => {
    if (open) {
      // Closing while a reply might be mid-sentence, stop it rather than
      // let it keep reading invisibly with the panel gone.
      stopSpeaking();
      setSpeakingIndex(null);
    }
    setOpen(!open);
  };

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-flame text-night shadow-lg flex items-center justify-center hover:scale-105 transition"
        title="Ask a study doubt"
        aria-label="Open study helper chat"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16v11H8l-4 4V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="9" cy="9.5" r="1" fill="currentColor" />
            <circle cx="12" cy="9.5" r="1" fill="currentColor" />
            <circle cx="15" cy="9.5" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[30rem] max-h-[72vh] bg-dusk rounded-2xl shadow-2xl ring-1 ring-slate-700 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-night border-b border-slate-700 flex items-center justify-between gap-2">
            <div>
              <p className="font-display text-paper text-sm">Study helper</p>
              <p className="font-body text-[11px] text-slate-400">Ask a doubt about any subject</p>
            </div>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              title="Language for voice input and listening to replies"
              className="bg-dusk text-slate-300 font-body text-xs rounded-full px-2 py-1 ring-1 ring-slate-700 shrink-0"
            >
              {Object.entries(VOICE_LANGUAGES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="font-body text-xs text-slate-500 text-center mt-8 px-4">
                Stuck on something? Type or use the mic to ask a question about Math, Science,
                English, Social Science, or Hindi, in any of the 6 languages above.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm font-body flex items-start gap-2 ${
                  m.role === "user"
                    ? "self-end bg-flame text-night"
                    : "self-start bg-night text-paper ring-1 ring-slate-700"
                }`}
              >
                <span className="flex-1">{m.content}</span>
                {m.role === "assistant" && (
                  <button
                    onClick={() => speakReply(m.content, i)}
                    disabled={speakingIndex != null}
                    title="Listen to this reply"
                    className="shrink-0 mt-0.5 text-teal disabled:text-slate-600"
                  >
                    {speakingIndex === i ? (
                      <span className="text-[10px] font-mono">...</span>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
                        <path d="M16 8a5 5 0 010 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}
            {sending && (
              <div className="self-start bg-night text-slate-400 ring-1 ring-slate-700 rounded-xl px-3 py-2 text-sm font-body">
                Thinking...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-700 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sending && send()}
              placeholder={unavailable ? "Study helper isn't set up yet" : "Type or use the mic..."}
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 bg-night text-paper font-body text-sm rounded-lg px-3 py-2 outline-none ring-1 ring-slate-700 focus:ring-teal"
            />
            <button
              onClick={listenForQuestion}
              disabled={!HAS_STT || listening}
              title={HAS_STT ? "Ask by voice" : "Voice input isn't supported in this browser"}
              className="shrink-0 w-10 rounded-lg bg-night ring-1 ring-slate-700 flex items-center justify-center text-teal disabled:text-slate-600 disabled:opacity-50"
            >
              {listening ? (
                <span className="text-[10px] font-mono">...</span>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                  <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="bg-flame disabled:bg-slate-700 disabled:text-slate-500 text-night font-body font-semibold text-sm px-4 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
