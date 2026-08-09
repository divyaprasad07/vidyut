// gamification/StreakFlame.jsx
export function StreakFlame({ current = 0, longest = 0 }) {
  const lit = current > 0;
  return (
    <div className="flex items-center gap-2 bg-dusk rounded-full px-4 py-2 w-fit">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2c1 3-2 4-2 7a4 4 0 108 0c0-1-1-2-1-2 2 1 3 3 3 5.5A6.5 6.5 0 015.5 19 6.5 6.5 0 019 7c0-2 1.5-3.5 3-5z"
          fill={lit ? "#F5A623" : "#3D4A6B"}
        />
      </svg>
      <span className="font-mono font-bold text-lg text-paper">{current}</span>
      <span className="font-body text-xs text-slate-400">day streak</span>
      {longest > current && (
        <span className="font-body text-xs text-slate-500 ml-1">· best {longest}</span>
      )}
    </div>
  );
}
