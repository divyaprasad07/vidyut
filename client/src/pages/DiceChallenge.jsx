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
import { Dice3D } from "../gamification/Dice3D";

export default function DiceChallenge() {
  const STUDENT_ID = localStorage.getItem("vidyut_student_id") || "stu_1";
  const navigate = useNavigate();
  const [phase, setPhase] = useState("rolling"); // rolling -> answering -> result
  const [diceValue, setDiceValue] = useState(null);
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
      const rollPromise = api.diceRoll(STUDENT_ID);
      const minTumbleTime = new Promise((resolve) => setTimeout(resolve, 1200));
      const [{ challenge }] = await Promise.all([rollPromise, minTumbleTime]);
      if (cancelled) return;
      setDiceValue(challenge.diceValue); // triggers the cube's settle transition, see Dice3D
      setTimeout(() => loadQuestionsForRoll(challenge.diceValue), 700); // let the settle animation finish first
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
    // Deliberately NOT clearing `result` here: the result screen stays
    // mounted (reading result.passed) until loadQuestionsForRoll's await
    // finishes and flips phase to "answering". Clearing result early left
    // a window where phase was still "result" but result was null, which
    // crashed on result.passed with no error boundary, blank page.
    loadQuestionsForRoll(diceValue);
  };

  if (phase === "rolling") {
    return (
      <div className="min-h-screen bg-night flex flex-col items-center justify-center gap-6 p-6">
        <OfflineIndicator />
        <p className="font-body text-slate-400">Rolling...</p>
        <Dice3D value={diceValue} rolling={diceValue == null} />
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
            <span className="w-8 h-8 rounded-lg bg-flame text-night font-display font-bold flex items-center justify-center text-sm">
              {diceValue}
            </span>
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
  if (!result) {
    // Defensive: should be unreachable now that retry() no longer clears
    // result early, but a blank crash is a bad enough failure mode that
    // this is worth guarding directly rather than trusting call order.
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <p className="font-body text-slate-400">Loading...</p>
      </div>
    );
  }
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
