// services/streakEngine.js
//
// TIER 1 — Daily streak counter. A day "counts" if the student completed
// at least one attempt on it. Streak continues if today or yesterday had
// activity; a gap of 2+ days resets it. Kept in calendar-day terms (not
// exact 24h windows) so a student who studies at 11pm and 6am the next
// day isn't unfairly broken.

function toDayKey(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * @param {string[]} attemptTimestamps ISO timestamps of every attempt, any order
 * @param {Date} now defaults to real now, injectable for tests
 * @returns {{ current: number, longest: number, lastActiveDay: string|null }}
 */
export function computeStreak(attemptTimestamps, now = new Date()) {
  if (!attemptTimestamps.length) {
    return { current: 0, longest: 0, lastActiveDay: null };
  }

  const activeDays = [
    ...new Set(attemptTimestamps.map((t) => toDayKey(new Date(t)))),
  ].sort();

  // longest streak, scanning consecutive calendar days
  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeDays.length; i++) {
    const prev = new Date(activeDays[i - 1]);
    const cur = new Date(activeDays[i]);
    const dayGap = Math.round((cur - prev) / 86400000);
    run = dayGap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // current streak, counting back from today/yesterday
  const todayKey = toDayKey(now);
  const yesterdayKey = toDayKey(new Date(now.getTime() - 86400000));
  const lastActiveDay = activeDays[activeDays.length - 1];

  let current = 0;
  if (lastActiveDay === todayKey || lastActiveDay === yesterdayKey) {
    current = 1;
    for (let i = activeDays.length - 1; i > 0; i--) {
      const gap = Math.round(
        (new Date(activeDays[i]) - new Date(activeDays[i - 1])) / 86400000
      );
      if (gap === 1) current++;
      else break;
    }
  }

  return { current, longest, lastActiveDay };
}
