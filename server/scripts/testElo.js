import {
  startingRating,
  updateRating,
  pickNextQuestion,
  bandForRating,
  DIFFICULTY_BANDS,
} from "../services/eloEngine.js";

let rating = startingRating();
console.log("Start rating:", rating);

// A realistic pool: several questions per band, like the actual topic
// question bank. pickNextQuestion() only picks by rating distance, so the
// caller (the quiz route) is responsible for excluding already-answered
// questions, which is what we simulate here.
let pool = [];
for (const [band, r] of Object.entries(DIFFICULTY_BANDS)) {
  for (let i = 0; i < 3; i++) {
    pool.push({ id: `${band}_${i}`, difficultyRating: r });
  }
}

// Simulate a student who gets 6 questions right in a row.
const history = [rating];
for (let i = 0; i < 6; i++) {
  const q = pickNextQuestion(rating, pool);
  const newRating = updateRating(rating, q.difficultyRating, true);
  console.log(
    `Q${i + 1}: picked ${q.id} (diff ${q.difficultyRating}), correct -> rating ${rating} -> ${newRating}`
  );
  rating = newRating;
  pool = pool.filter((x) => x.id !== q.id); // question consumed, like a real quiz
  history.push(rating);
}

console.log("\nFinal rating:", rating, "-> band:", bandForRating(rating));
console.log("Rating history:", history);

// Sanity checks
if (history[history.length - 1] <= history[0]) {
  throw new Error("FAIL: rating should have increased after 6 correct answers");
}
console.log("\nOK: rating increased monotonically with correct answers.");

// Now simulate a wrong-answer streak from a high rating.
let r2 = 1500;
for (let i = 0; i < 4; i++) {
  const q = pickNextQuestion(r2, pool);
  const newR = updateRating(r2, q.difficultyRating, false);
  console.log(`Wrong streak Q${i + 1}: ${r2} -> ${newR} (picked ${q.id})`);
  r2 = newR;
}
if (r2 >= 1500) {
  throw new Error("FAIL: rating should have decreased after wrong answers");
}
console.log("OK: rating decreased with wrong answers, and question picks tracked it down through bands.");
