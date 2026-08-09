// services/eloEngine.js
//
// TIER 1 — Adaptive difficulty engine.
// This is a straightforward Elo rating system, the same math chess
// ratings use, not full Item Response Theory and not a trained RL policy.
// In the UI and pitch this is called an "IRT-inspired adaptive engine":
// it borrows IRT's core idea (a single latent ability parameter per
// student per topic, compared against a per-item difficulty parameter)
// without doing the multi-parameter estimation real IRT requires.

const START_RATING = 1000;
const K_FACTOR = 32;

// Difficulty bands map to a representative Elo rating for question
// selection purposes. Every question is tagged with one of these bands
// at seed time.
export const DIFFICULTY_BANDS = {
  easy: 800,
  medium: 1000,
  hard: 1250,
  very_hard: 1500,
};

export function startingRating() {
  return START_RATING;
}

/** Probability the student answers correctly, given the question's rating. */
function expectedScore(studentRating, questionRating) {
  return 1 / (1 + Math.pow(10, (questionRating - studentRating) / 400));
}

/**
 * Update a student's rating after one answer.
 * @param {number} studentRating current rating for this topic
 * @param {number} questionRating the answered question's difficulty rating
 * @param {boolean} correct whether the answer was correct
 * @returns {number} new rating, rounded to the nearest integer
 */
export function updateRating(studentRating, questionRating, correct) {
  const expected = expectedScore(studentRating, questionRating);
  const actual = correct ? 1 : 0;
  const newRating = studentRating + K_FACTOR * (actual - expected);
  return Math.round(newRating);
}

/**
 * Pick the next question for a student in a topic.
 * Strategy: among unattempted questions in the topic, pick the one whose
 * difficulty rating is closest to the student's current rating. This
 * naturally pulls the next question from a harder band after a correct
 * answer (rating went up) and an easier band after a wrong one (rating
 * went down), without hardcoding "go up one band" / "go down one band" —
 * so it stays sane even after a rating jump.
 */
export function pickNextQuestion(studentRating, availableQuestions) {
  if (!availableQuestions.length) return null;
  return availableQuestions.reduce((closest, q) => {
    const closestDiff = Math.abs(closest.difficultyRating - studentRating);
    const qDiff = Math.abs(q.difficultyRating - studentRating);
    return qDiff < closestDiff ? q : closest;
  });
}

/** Human-readable band for a given rating, used for badge/mastery display. */
export function bandForRating(rating) {
  if (rating < 900) return "easy";
  if (rating < 1150) return "medium";
  if (rating < 1400) return "hard";
  return "very_hard";
}
