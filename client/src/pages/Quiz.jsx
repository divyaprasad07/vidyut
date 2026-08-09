// pages/Quiz.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { submitAttemptOnlineOrQueued } from "../services/offlineQueue";
import { useQuizIntegrity } from "../hooks/useQuizIntegrity";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { speak, listen } from "../services/languageProvider";


const MODE_LABELS = { mcq: "Multiple choice", short: "Short answer", mixed: "Mixed" };
const VOICE_LANGUAGES = { en: "English", hi: "Hindi", bn: "Bengali", mr: "Marathi", ta: "Tamil", te: "Telugu" };
// Feature-detected once, not per-render: a browser without speech
// recognition still gets the mic button (visible, not hidden) but
// disabled with an explanation, per the "visible fallback" rule. TTS
// availability can't be feature-detected this way anymore since it now
// depends on the server (espeak-ng), not the browser, so that's tracked
// with real success/failure per attempt instead, see speakQuestion below.
const HAS_STT = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function Quiz() {
  const STUDENT_ID = localStorage.getItem("vidyut_student_id") || "stu_1";
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizMode = ["mcq", "short", "mixed"].includes(searchParams.get("mode"))
    ? searchParams.get("mode")
    : "mixed";
  const [voiceLang, setVoiceLang] = useState(
    Object.keys(VOICE_LANGUAGES).includes(searchParams.get("voice")) ? searchParams.get("voice") : "en"
  );
  const [speaking, setSpeaking] = useState(false);
  const [listeningNow, setListeningNow] = useState(false);
  const [voiceOutputError, setVoiceOutputError] = useState(false);

  const [question, setQuestion] = useState(null);
  const [showAsMcq, setShowAsMcq] = useState(true); // per-question, only varies in "mixed" mode
  const [answered, setAnswered] = useState([]); // [{questionId, submittedAnswer, timeTakenSec}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [integrityWarning, setIntegrityWarning] = useState(null); // {count, remaining, violationType}
  const questionStartRef = useRef(Date.now());
  // Keeps the latest `answered` readable from the integrity callbacks
  // below without needing `answered` in their dependency array — that
  // would give them a new identity every answer, which would make the
  // warning-count effect in useQuizIntegrity re-attach its listeners
  // constantly and lose track of how many warnings have been given.
  const answeredRef = useRef([]);
  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);
  // Session-local state so the engine actually adapts within one quiz, not
  // just between quizzes: every shown question is excluded from future
  // picks in this session, and sessionRating is updated (via
  // /api/questions/check, which scores but doesn't persist) after each
  // answer so the next pick reflects it. The real persisted rating still
  // only updates once, at quiz end, from the full answer sequence.
  const excludeIdsRef = useRef([]);
  const sessionRatingRef = useRef(null);

  const loadNext = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.nextQuestion(
        STUDENT_ID,
        topicId,
        excludeIdsRef.current,
        sessionRatingRef.current
      );
      if (res.done) {
        setDone(true);
        setQuestion(null);
      } else {
        setQuestion(res.question);
        setVoiceOutputError(false);
        // Decide how THIS question renders. "mcq"/"short" are fixed for the
        // whole quiz; "mixed" picks per question so a student genuinely
        // gets a blend, not just whichever the first question happened to be.
        const hasOptions = res.question.options && res.question.options.length > 0;
        if (quizMode === "mcq") setShowAsMcq(hasOptions);
        else if (quizMode === "short") setShowAsMcq(false);
        else setShowAsMcq(hasOptions && Math.random() < 0.5);
        excludeIdsRef.current = [...excludeIdsRef.current, res.question.id];
        if (sessionRatingRef.current == null) sessionRatingRef.current = res.currentRating;
        questionStartRef.current = Date.now();
      }
    } catch (err) {
      // Offline and this question wasn't cached by the service worker —
      // fall back to letting the student finish with what's already
      // answered rather than getting stuck on a spinner.
      console.warn("Could not fetch next question, likely offline:", err);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [topicId, quizMode]);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  const finishQuiz = useCallback(
    async (finalAnswers, autoSubmitted = false, violationType = null) => {
      const { queued, result } = await submitAttemptOnlineOrQueued({
        studentId: STUDENT_ID,
        topicId,
        answers: finalAnswers,
        autoSubmitted,
        violationType,
        quizMode, // needed server-side to award the Platinum badge only for MCQ-mode perfect scores
      });
      setResult({
        queued,
        autoSubmitted,
        violationType,
        questionsAttempted: finalAnswers.length,
        review: result?.review, // undefined when queued offline until it syncs
        score: result?.score,
        platinumEarned: result?.platinumEarned, // undefined when queued offline until it syncs
      });
      setDone(true);
    },
    [topicId, quizMode]
  );

  // Tier 1 feature 5: quiz-integrity. The first two times a student leaves
  // the quiz screen (tab switch, minimize, PiP), they get a clearly
  // visible warning and the quiz keeps going, this can easily happen by
  // accident (a notification, a misclick, a network hiccup briefly
  // stealing focus) so it shouldn't cost an attempt on the first slip.
  // Only the third occurrence actually auto-submits.
  const handleIntegrityWarning = useCallback((violationType, count, remaining) => {
    setIntegrityWarning({ count, remaining, violationType });
  }, []);
  const handleIntegrityViolation = useCallback(
    (violationType) => {
      setIntegrityWarning(null);
      finishQuiz(answeredRef.current, true, violationType);
    },
    [finishQuiz]
  );
  useQuizIntegrity(!done && !!question, {
    onWarning: handleIntegrityWarning,
    onViolation: handleIntegrityViolation,
  });

  const submitAnswer = async (explicitAnswer) => {
    const submittedAnswer = explicitAnswer ?? input;
    if (!submittedAnswer || !submittedAnswer.trim() || submitting) return;
    setSubmitting(true);
    const timeTakenSec = Math.round((Date.now() - questionStartRef.current) / 1000);
    const entry = { questionId: question.id, submittedAnswer, timeTakenSec };
    const next = [...answered, entry];
    setAnswered(next);
    setInput("");

    // Score it now (without persisting) so the next pick can actually be
    // harder or easier, not just closest-to-starting-rating every time.
    try {
      const { newRating } = await api.checkAnswer({
        questionId: entry.questionId,
        submittedAnswer: entry.submittedAnswer,
        currentRating: sessionRatingRef.current,
      });
      sessionRatingRef.current = newRating;
    } catch (err) {
      console.warn("Live scoring check failed, next pick will use the last known rating:", err);
    }

    if (next.length >= 8) {
      await finishQuiz(next);
    } else {
      await loadNext();
    }
    setSubmitting(false);
  };

  const speakQuestion = async () => {
    if (!question || speaking) return;
    setSpeaking(true);
    const ok = await speak(question.text, voiceLang);
    setVoiceOutputError(!ok);
    setSpeaking(false);
  };

  const listenForAnswer = async () => {
    if (listeningNow) return;
    setListeningNow(true);
    const transcript = await listen(voiceLang);
    if (transcript) setInput(transcript);
    setListeningNow(false);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-night flex flex-col items-center p-6">
        <OfflineIndicator />
        <div className="w-full max-w-lg mt-16 text-center">
          {result.platinumEarned && (
            <div className="animate-unlock-pop bg-gradient-to-br from-white via-slate-100 to-slate-300 text-night rounded-2xl px-6 py-5 mb-6 ring-2 ring-flame">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2">
                <polygon points="12,2 22,9 18,22 6,22 2,9" fill="currentColor" opacity="0.9" />
              </svg>
              <p className="font-display text-lg font-bold">You've won a Platinum Badge!</p>
              <p className="font-body text-xs mt-1 opacity-80">
                Perfect score on an 8+ question Multiple Choice quiz, that's a rare one.
              </p>
            </div>
          )}
          <h1 className="font-display text-3xl text-paper mb-2">
            {result.autoSubmitted ? "Quiz ended early" : "Quiz submitted"}
          </h1>
          {result.score != null && (
            <p className="font-mono text-2xl text-teal mb-4">
              {result.score} / {result.questionsAttempted}
            </p>
          )}
          {result.autoSubmitted && (
            <p className="font-body text-slate-300 max-w-sm mx-auto mb-2">
              After two warnings, we noticed you left the quiz screen a third time, so it was
              auto-submitted with the {result.questionsAttempted} question
              {result.questionsAttempted === 1 ? "" : "s"} you'd already answered.
            </p>
          )}
          {result.queued && (
            <p className="font-body text-flame max-w-sm mx-auto mb-2">
              You were offline, so this attempt is queued and will sync as soon as you're back
              online. The answer review below isn't available until it syncs.
            </p>
          )}

          {result.review && result.review.length > 0 && (
            <div className="text-left mt-6 mb-6">
              <h2 className="font-display text-lg text-paper mb-3">Review your answers</h2>
              <div className="flex flex-col gap-3">
                {result.review.map((r, i) => (
                  <div
                    key={r.questionId}
                    className={`rounded-xl p-4 ring-1 ${
                      r.correct ? "bg-dusk ring-teal/40" : "bg-dusk ring-red-500/40"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <span
                        className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                          r.correct ? "bg-teal text-night" : "bg-red-500 text-white"
                        }`}
                      >
                        {r.correct ? "✓" : "✕"}
                      </span>
                      <p className="font-body text-sm text-paper">
                        {i + 1}. {r.questionText}
                      </p>
                    </div>
                    <p className="font-body text-xs text-slate-400 ml-7">
                      Your answer: <span className={r.correct ? "text-teal" : "text-red-400"}>{r.submittedAnswer || "(no answer)"}</span>
                    </p>
                    {!r.correct && (
                      <p className="font-body text-xs text-slate-400 ml-7">
                        Correct answer: <span className="text-teal">{r.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/")}
            className="mt-2 bg-flame text-night font-display font-semibold px-6 py-3 rounded-full"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (done && !question) {
    return (
      <div className="min-h-screen bg-night flex flex-col items-center justify-center gap-4 p-6 text-center">
        <OfflineIndicator />
        <h1 className="font-display text-2xl text-paper">
          {answered.length > 0 ? "Finishing up..." : "No more questions in this topic yet"}
        </h1>
        {answered.length > 0 ? (
          <button
            onClick={() => finishQuiz(answered)}
            className="bg-flame text-night font-display font-semibold px-6 py-3 rounded-full"
          >
            Submit {answered.length} answer{answered.length === 1 ? "" : "s"}
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="bg-dusk text-paper font-display px-6 py-3 rounded-full"
          >
            Back to home
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night flex flex-col items-center p-6">
      <OfflineIndicator />

      {integrityWarning && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-dusk rounded-2xl p-6 max-w-sm w-full ring-2 ring-flame text-center">
            <div className="w-12 h-12 rounded-full bg-flame/20 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L14.7 3.86a2 2 0 00-3.4 0z" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-display text-xl text-paper mb-2">
              Warning {integrityWarning.count} of 2
            </h2>
            <p className="font-body text-sm text-slate-300 mb-1">
              We noticed you left this quiz screen. This can happen by accident, a notification, a
              misclick, or a brief network hiccup, so this time it's just a warning.
            </p>
            <p className="font-body text-sm text-flame mb-5">
              {integrityWarning.remaining > 0
                ? `${integrityWarning.remaining} more time${integrityWarning.remaining === 1 ? "" : "s"} and your quiz will auto-submit with your current answers.`
                : "One more time and your quiz will auto-submit with your current answers."}
            </p>
            <button
              onClick={() => setIntegrityWarning(null)}
              className="bg-flame text-night font-display font-semibold px-6 py-2.5 rounded-full"
            >
              Continue quiz
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg mt-16">
        <div className="flex items-center justify-between mb-6">
          <span className="font-body text-sm text-slate-400">
            Question {answered.length + 1} of 8
          </span>
          <div className="flex items-center gap-2">
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              className="bg-night text-slate-300 font-body text-xs rounded-full px-2 py-1 ring-1 ring-slate-700"
              title="Voice language for reading questions aloud and voice answers"
            >
              {Object.entries(VOICE_LANGUAGES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <span className="font-body text-xs text-slate-500">{MODE_LABELS[quizMode]}</span>
            <span className="font-mono text-sm text-teal">{topicId}</span>
          </div>
        </div>

        {loading || !question ? (
          <div className="text-paper font-body">Loading next question...</div>
        ) : (
          <div className="bg-dusk rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <p className="font-display text-xl text-paper">{question.text}</p>
              <button
                onClick={speakQuestion}
                disabled={speaking}
                title="Read question aloud"
                className="shrink-0 w-9 h-9 rounded-full bg-night ring-1 ring-slate-700 flex items-center justify-center text-teal disabled:text-slate-600 disabled:opacity-50"
              >
                {speaking ? (
                  <span className="text-xs font-mono">...</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
                    <path d="M16 8a5 5 0 010 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
            {voiceOutputError && (
              <p className="font-body text-[11px] text-slate-500 -mt-3 mb-4">
                Voice output isn't available right now, you can still read the question above.
              </p>
            )}

            {showAsMcq ? (
              <div className="flex flex-col gap-3">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={submitting}
                    onClick={() => submitAnswer(opt)}
                    className="w-full text-left bg-night hover:bg-slate-800 disabled:opacity-50 text-paper font-body rounded-xl px-4 py-3 ring-1 ring-slate-700 hover:ring-teal transition"
                  >
                    <span className="font-mono text-teal mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && input.trim() && submitAnswer()}
                    placeholder="Type your answer"
                    className="flex-1 bg-night text-paper font-body rounded-xl px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-teal"
                  />
                  <button
                    onClick={listenForAnswer}
                    disabled={!HAS_STT || listeningNow}
                    title={HAS_STT ? "Answer by voice" : "Voice input isn't supported in this browser"}
                    className="shrink-0 w-12 rounded-xl bg-night ring-1 ring-slate-700 flex items-center justify-center text-teal disabled:text-slate-600 disabled:opacity-50"
                  >
                    {listeningNow ? (
                      <span className="text-xs font-mono">...</span>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                        <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
                {!HAS_STT && (
                  <p className="font-body text-[11px] text-slate-500 mt-1.5">
                    Voice input isn't available in this browser, you can still type your answer.
                  </p>
                )}
                <button
                  disabled={!input.trim() || submitting}
                  onClick={() => submitAnswer()}
                  className="mt-4 w-full bg-flame disabled:bg-slate-700 disabled:text-slate-500 text-night font-display font-semibold py-3 rounded-xl"
                >
                  Submit answer
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
