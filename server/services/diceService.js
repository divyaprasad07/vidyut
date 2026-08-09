// services/diceService.js
//
// Daily streak "roll the dice" challenge. Deliberately separate from the
// main quiz/Elo system: rolling picks a number 1-6, that many random
// questions (any subject, no adaptive difficulty) get presented, and
// getting at least 50% right marks the day's streak. None of this ever
// touches a student's topic rating or the leaderboard, on purpose, this
// is attendance, not mastery. Regular topic quizzes (server/index.js's
// /api/attempts route) no longer feed the streak at all, only a passed
// dice challenge does, see the streak computation in the
// GET /api/students/:id route.

import { getCollection, getDoc, addDoc, updateDoc } from "./db.js";

const PASS_THRESHOLD = 0.5; // 50% correct required to secure the day's streak

export function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, same convention as streakEngine.js
}

export function rollDice() {
  return Math.floor(Math.random() * 6) + 1; // 1-6
}

/** Today's dice challenge record for a student, or null if not rolled yet today. */
export async function getTodayChallenge(studentId) {
  const all = await getCollection("dice_challenges");
  return all.find((c) => c.studentId === studentId && c.date === todayKey()) || null;
}

/**
 * Roll for today, idempotent: if already rolled today, returns the
 * existing record instead of rolling again, so refreshing the page or
 * double-clicking can't reroll a fresh number out from under a student
 * mid-challenge.
 */
export async function rollForToday(studentId) {
  const existing = await getTodayChallenge(studentId);
  if (existing) return existing;

  const id = await addDoc("dice_challenges", {
    studentId,
    date: todayKey(),
    diceValue: rollDice(),
    passed: false,
    attempts: [],
    createdAt: new Date().toISOString(),
  });
  return { id, ...(await getDoc("dice_challenges", id)) };
}

/**
 * Pick `count` random questions from across every subject (no adaptive
 * difficulty here, this isn't about mastery). `excludeIds` keeps a retry
 * from repeating the exact same questions as a prior failed attempt
 * today, where possible.
 */
export async function pickRandomQuestions(count, excludeIds = []) {
  const all = await getCollection("questions");
  const excluded = new Set(excludeIds);
  let pool = all.filter((q) => !excluded.has(q.id));
  if (pool.length < count) pool = all; // not enough unseen left, allow repeats rather than short-changing the count
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Score a submitted batch against the correct answers and record the
 * attempt on today's challenge. Passing (>=50%) marks the day secured;
 * failing leaves it open for a retry (same dice value, fresh questions).
 * Never touches `students` ratings or the `attempts` collection, that
 * separation from the leaderboard is the whole point of this feature.
 */
export async function submitChallenge(studentId, answers) {
  const challenge = await getTodayChallenge(studentId);
  if (!challenge) throw new Error("no dice challenge rolled today");
  if (challenge.passed) throw new Error("today's streak is already secured");

  const allQuestions = await getCollection("questions");
  let score = 0;
  const review = [];
  for (const ans of answers) {
    const q = allQuestions.find((x) => x.id === ans.questionId);
    if (!q) continue;
    const correct =
      q.correctAnswer.trim().toLowerCase() === String(ans.submittedAnswer || "").trim().toLowerCase();
    if (correct) score++;
    review.push({ questionId: q.id, questionText: q.text, submittedAnswer: ans.submittedAnswer, correctAnswer: q.correctAnswer, correct });
  }

  const passed = answers.length > 0 && score / answers.length >= PASS_THRESHOLD;
  const attempts = [...(challenge.attempts || []), { score, questionsAttempted: answers.length, passed, timestamp: new Date().toISOString() }];
  await updateDoc("dice_challenges", challenge.id, { attempts, passed: challenge.passed || passed });

  return { score, questionsAttempted: answers.length, passed, review };
}

/**
 * Streak timestamps for computeStreak() (see streakEngine.js): one
 * per calendar day the student PASSED a dice challenge, failed-only days
 * don't count, matching the "50% to secure the streak" rule.
 */
export async function getStreakDates(studentId) {
  const all = await getCollection("dice_challenges");
  return all
    .filter((c) => c.studentId === studentId && c.passed)
    .map((c) => c.createdAt);
}
