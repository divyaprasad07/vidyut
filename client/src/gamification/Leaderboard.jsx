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
    <div className="glass-card rounded-[32px] p-6 w-full shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-slate-800 text-lg font-bold">{topicName} rank</h3>
        <div className="flex bg-white/60 rounded-full p-1 text-xs font-body">
          <button
            onClick={() => setScope("class")}
            className={`px-3 py-1 rounded-full transition ${
              scope === "class" ? "bg-[#008080] text-white font-semibold" : "text-slate-500"
            }`}
          >
            My class
          </button>
          <button
            onClick={() => setScope("global")}
            className={`px-3 py-1 rounded-full transition ${
              scope === "global" ? "bg-[#008080] text-white font-semibold" : "text-slate-500"
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
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${
                isMe ? "bg-[#E0F2F2] border border-[#008080]/20" : "hover:bg-white/60"
              }`}
            >
              <span className="font-mono text-sm w-6 text-center text-slate-400 font-bold">{i + 1}</span>
              <span className={`font-body flex-1 truncate ${isMe ? "text-[#008080] font-bold" : "text-slate-700 font-medium"}`}>
                {e.studentName}
                {isMe && " (you)"}
              </span>
              {e.platinumBadges > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 bg-gradient-to-br from-white to-slate-300 text-slate-700 text-[10px] font-display font-bold px-1.5 py-0.5 rounded-full shrink-0 border border-slate-200"
                  title={`${e.platinumBadges} Platinum Badge${e.platinumBadges === 1 ? "" : "s"}`}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 22,9 18,22 6,22 2,9" fill="currentColor" opacity="0.85" />
                  </svg>
                  {e.platinumBadges}
                </span>
              )}
              <span className="font-mono text-sm text-[#008080] font-bold">{e.rating}</span>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="text-slate-400 text-sm font-body py-2 text-center">
            No attempts on this topic yet in this view. Be the first.
          </li>
        )}
      </ol>
    </div>
  );
}
