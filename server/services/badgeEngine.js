// services/badgeEngine.js
//
// TIER 1 — Gamification: mastery-tier badges ("stones").
// Mastery % is derived from the student's Elo rating in a topic, mapped
// onto a 700-1600 band (700 = a brand-new learner, 1600 = comfortably
// past "very_hard" questions). Diamond additionally requires an accuracy
// and speed bar over the student's last 5 attempts in that topic, so a
// single lucky streak can't buy the top tier.

const MASTERY_RATING_FLOOR = 700;
const MASTERY_RATING_CEILING = 1600;

export const TIERS = [
  {
    id: "diamond",
    threshold: 100,
    label: "Diamond Stone",
    icon: "diamond-stone",
    flavor: "Flawless. Fast. Feared on the leaderboard.",
  },
  {
    id: "gold",
    threshold: 90,
    label: "Gold Stone",
    icon: "gold-stone",
    flavor: "This topic bends to your will now.",
  },
  {
    id: "silver",
    threshold: 75,
    label: "Silver Stone",
    icon: "silver-stone",
    flavor: "Solid ground. The hard questions stopped scaring you.",
  },
  {
    id: "bronze",
    threshold: 60,
    label: "Bronze Stone",
    icon: "bronze-stone",
    flavor: "First foothold. Everyone starts here.",
  },
];

export function masteryPercent(rating) {
  const pct =
    ((rating - MASTERY_RATING_FLOOR) /
      (MASTERY_RATING_CEILING - MASTERY_RATING_FLOOR)) *
    100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Decide which tier(s) a student has earned in a topic, given their rating
 * and their last few attempts in that topic (most recent first).
 * Returns the array of tier ids earned (a student who hits diamond has
 * also earned gold/silver/bronze along the way).
 */
export function earnedTiers(rating, recentAttempts = []) {
  const pct = masteryPercent(rating);
  const earned = [];

  for (const tier of TIERS.slice().reverse()) {
    // iterate bronze -> diamond
    if (pct < tier.threshold) continue;

    if (tier.id === "diamond") {
      const last5 = recentAttempts.slice(0, 5);
      if (last5.length < 5) continue; // need a track record, not one lucky run
      const accuracy =
        last5.reduce((sum, a) => sum + a.score / a.questionsAttempted, 0) /
        last5.length;
      const avgTimePerQ =
        last5.reduce((sum, a) => sum + a.timeTakenSec / a.questionsAttempted, 0) /
        last5.length;
      if (accuracy < 0.9 || avgTimePerQ > 25) continue; // speed/accuracy bar
    }
    earned.push(tier.id);
  }
  return earned;
}

export function tierMeta(tierId) {
  return TIERS.find((t) => t.id === tierId);
}
