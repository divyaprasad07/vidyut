// gamification/Leaderboard.jsx
import { useState, useMemo } from "react";

/**
 * entries: [{ studentId, studentName, class, rating, platinumBadges }]
 * Defaults to class-scoped so a student weak overall still has a board
 * they can realistically compete on; the toggle widens it for students
 * who want the aspirational global view. Platinum badge counts show
 * alongside each entry, a second axis of competition independent of the
 * topic rating this board is actually sorted by.
 */
export function Leaderboard({ entries, currentStudentClass, currentStudentId, topicName }) {
  const [scope, setScope] = useState("class");

  const filtered = useMemo(() => {
    const list =
      scope === "class"
        ? entries.filter((e) => e.class === currentStudentClass)
        : entries;
    return [...list].sort((a, b) => b.rating - a.rating).slice(0, 10);
  }, [entries, scope, currentStudentClass]);

  return (
    <div className="bg-dusk rounded-2xl p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-paper text-lg">{topicName} leaderboard</h3>
        <div className="flex bg-night rounded-full p-1 text-xs font-body">
          <button
            onClick={() => setScope("class")}
            className={`px-3 py-1 rounded-full transition ${
              scope === "class" ? "bg-flame text-night font-semibold" : "text-slate-400"
            }`}
          >
            My class
          </button>
          <button
            onClick={() => setScope("global")}
            className={`px-3 py-1 rounded-full transition ${
              scope === "global" ? "bg-flame text-night font-semibold" : "text-slate-400"
            }`}
          >
            School-wide
          </button>
        </div>
      </div>
      <ol className="flex flex-col gap-1.5">
        {filtered.map((e, i) => {
          const isMe = e.studentId === currentStudentId;
          return (
            <li
              key={e.studentId}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isMe ? "bg-flame/20 ring-1 ring-flame" : ""
              }`}
            >
              <span className="font-mono text-sm w-6 text-slate-400">{i + 1}</span>
              <span className={`font-body flex-1 truncate ${isMe ? "text-flame font-semibold" : "text-paper"}`}>
                {e.studentName}
                {isMe && " (you)"}
              </span>
              {e.platinumBadges > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 bg-gradient-to-br from-white to-slate-300 text-night text-[10px] font-display font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  title={`${e.platinumBadges} Platinum Badge${e.platinumBadges === 1 ? "" : "s"}`}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 22,9 18,22 6,22 2,9" fill="currentColor" opacity="0.85" />
                  </svg>
                  {e.platinumBadges}
                </span>
              )}
              <span className="font-mono text-sm text-teal">{e.rating}</span>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="text-slate-500 text-sm font-body py-2">
            No attempts on this topic yet in this view. Be the first.
          </li>
        )}
      </ol>
    </div>
  );
}
