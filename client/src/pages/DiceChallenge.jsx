// pages/DiceChallenge.jsx
//
// Deliberately its own page, not folded into the main Quiz flow: this has
// a genuinely different shape (variable question count, no adaptive
// difficulty, a pass/fail retry loop, and critically, it must never call
// anything that touches a student's rating). Keeping it separate makes
// that separation obvious in the code, not just enforced by convention.

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { OfflineIndicator } from "../components/OfflineIndicator";

const STUDENT_ID = "stu_1";
const DICE_FACES = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"]; // ⚀-⚅

export default function DiceChallenge() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("rolling"); // rolling -> answering -> result
  const [diceValue, setDiceValue] = useState(null);
  const [animatedFace, setAnimatedFace] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const seenIdsRef = useRef([]);

  const loadQuestionsForRoll = useCallback(async (count) => {
    setLoading(true);
    const { questions: qs } = await api.diceQuestions(count, seenIdsRef.current);
    seenIdsRef.current = [...seenIdsRef.current, ...qs.map((q) => q.id)];
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswered([]);
    setLoading(false);
    setPhase("answering");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Roll first (idempotent server-side, so this is safe even if the
      // student already rolled today and is just resuming).
      const { challenge } = await api.diceRoll(STUDENT_ID);
      if (cancelled) return;
      const finalValue = challenge.diceValue;

      // Quick tumble animation, then settle on the real server value, so
      // "roll" feels like an event rather than an instant number.
      let ticks = 0;
      const interval = setInterval(() => {
        setAnimatedFace(Math.floor(Math.random() * 6));
        ticks++;
        if (ticks > 10) {
          clearInterval(interval);
          setDiceValue(finalValue);
          setAnimatedFace(finalValue - 1);
          setTimeout(() => loadQuestionsForRoll(finalValue), 500);
        }
      }, 90);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadQuestionsForRoll]);

  const submitAnswer = async (explicitAnswer) => {
    const value = explicitAnswer ?? input;
    if (!value || !value.trim()) return;
    const question = questions[currentIndex];
    const next = [...answered, { questionId: question.id, submittedAnswer: value }];
    setAnswered(next);
    setInput("");

    if (next.length >= questions.length) {
      setLoading(true);
      const res = await api.diceSubmit(STUDENT_ID, next);
      setResult(res);
      setPhase("result");
      setLoading(false);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const retry = () => {
    setResult(null);
    loadQuestionsForRoll(diceValue);
  };

  if (phase === "rolling") {
    return (
      <div className="min-h-screen bg-night flex flex-col items-center justify-center gap-6 p-6">
        <OfflineIndicator />
        <p className="font-body text-slate-400">Rolling...</p>
        <div className="text-8xl text-flame leading-none">{DICE_FACES[animatedFace]}</div>
      </div>
    );
  }

  if (phase === "answering") {
    const question = questions[currentIndex];
    return (
      <div className="min-h-screen bg-night flex flex-col items-center p-6">
        <OfflineIndicator />
        <div className="w-full max-w-lg mt-16">
          <div className="flex items-center justify-between mb-6">
            <span className="font-body text-sm text-slate-400">
              Streak challenge, question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-2xl text-flame">{DICE_FACES[diceValue - 1]}</span>
          </div>

          {loading || !question ? (
            <div className="text-paper font-body">Loading...</div>
          ) : (
            <div className="bg-dusk rounded-2xl p-6">
              <p className="font-display text-xl text-paper mb-5">{question.text}</p>
              {question.options && question.options.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {question.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => submitAnswer(opt)}
                      className="w-full text-left bg-night hover:bg-slate-800 text-paper font-body rounded-xl px-4 py-3 ring-1 ring-slate-700 hover:ring-teal transition"
                    >
                      <span className="font-mono text-teal mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && input.trim() && submitAnswer()}
                    placeholder="Type your answer"
                    className="w-full bg-night text-paper font-body rounded-xl px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-teal"
                  />
                  <button
                    disabled={!input.trim()}
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

  // phase === "result"
  return (
    <div className="min-h-screen bg-night flex flex-col items-center p-6">
      <OfflineIndicator />
      <div className="w-full max-w-lg mt-16 text-center">
        <div className="text-6xl mb-4">{result.passed ? "\u{1F525}" : "\u{1F914}"}</div>
        <h1 className="font-display text-3xl text-paper mb-2">
          {result.passed ? "Streak secured for today!" : "Not quite, need 50%+"}
        </h1>
        <p className="font-mono text-xl text-teal mb-4">
          {result.score} / {result.questionsAttempted}
        </p>
        <p className="font-body text-sm text-slate-400 mb-6">
          This challenge only affects your streak, it doesn't change your topic ratings or the
          leaderboard.
        </p>
        {result.passed ? (
          <button
            onClick={() => navigate("/")}
            className="bg-flame text-night font-display font-semibold px-6 py-3 rounded-full"
          >
            Back to home
          </button>
        ) : (
          <div className="flex gap-3 justify-center">
            <button
              onClick={retry}
              className="bg-flame text-night font-display font-semibold px-6 py-3 rounded-full"
            >
              Try again
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-dusk text-paper font-display px-6 py-3 rounded-full ring-1 ring-slate-700"
            >
              Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
