// services/analytics.js
//
// TIER 1 — Teacher analytics dashboard queries. These read from real
// `attempts` and `students` data (never a static flag), so they work the
// same whether the underlying store is the local JSON file or Firestore.

import { getCollection } from "./db.js";

/**
 * Students whose activity or accuracy has dropped over a recent window.
 * "Declining" = comparing the first half of the window to the second half:
 * either the attempt count halved or accuracy dropped by 15+ points.
 * A student with zero attempts in the second half but some in the first
 * counts as declining too (that's the clearest decline signal there is).
 */
export async function getDecliningActivity(windowDays = 7) {
  const [students, attempts] = await Promise.all([
    getCollection("students"),
    getCollection("attempts"),
  ]);

  const now = Date.now();
  const windowMs = windowDays * 86400000;
  const midpoint = now - windowMs / 2;
  const windowStart = now - windowMs;

  const results = [];
  for (const student of students) {
    const inWindow = attempts.filter(
      (a) =>
        a.studentId === student.id &&
        new Date(a.timestamp).getTime() >= windowStart
    );
    const firstHalf = inWindow.filter(
      (a) => new Date(a.timestamp).getTime() < midpoint
    );
    const secondHalf = inWindow.filter(
      (a) => new Date(a.timestamp).getTime() >= midpoint
    );

    if (firstHalf.length === 0) continue; // no baseline to compare against

    const acc = (list) =>
      list.length
        ? list.reduce((s, a) => s + a.score / a.questionsAttempted, 0) /
          list.length
        : 0;

    const countDrop = secondHalf.length < firstHalf.length * 0.5;
    const accDrop = acc(firstHalf) - acc(secondHalf) >= 0.15;

    if (countDrop || accDrop) {
      results.push({
        studentId: student.id,
        studentName: student.name,
        firstHalfAttempts: firstHalf.length,
        secondHalfAttempts: secondHalf.length,
        firstHalfAccuracy: Math.round(acc(firstHalf) * 100),
        secondHalfAccuracy: Math.round(acc(secondHalf) * 100),
        reason: countDrop && accDrop
          ? "activity and accuracy both dropped"
          : countDrop
          ? "activity dropped"
          : "accuracy dropped",
      });
    }
  }
  return results;
}

/** Students below a rating threshold in a given topic. */
export async function getWeakInTopic(topicId, ratingThreshold = 1000) {
  const students = await getCollection("students");
  return students
    .filter((s) => (s.ratings?.[topicId]?.rating ?? 1000) < ratingThreshold)
    .map((s) => ({
      studentId: s.id,
      studentName: s.name,
      rating: s.ratings?.[topicId]?.rating ?? 1000,
    }))
    .sort((a, b) => a.rating - b.rating);
}

/** Teacher-only plain ranked table, all students, all topics combined (avg rating). */
export async function getTeacherRatingLeaderboard() {
  const students = await getCollection("students");
  return students
    .map((s) => {
      const ratings = Object.values(s.ratings || {}).map((r) => r.rating);
      const avg = ratings.length
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : 1000;
      return { studentId: s.id, studentName: s.name, avgRating: avg };
    })
    .sort((a, b) => b.avgRating - a.avgRating);
}

/** Per-student quiz history: every attempt, every topic. */
export async function getStudentQuizHistory(studentId) {
  const attempts = await getCollection("attempts");
  return attempts
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
