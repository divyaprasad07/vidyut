// gamification/Stone.jsx
const TIER_GRADIENTS = {
  bronze: ["#8A6432", "#D8A85E", "#B08D57"],
  silver: ["#9AA3AB", "#F0F4F7", "#C7CDD4"],
  gold: ["#C9860E", "#FFE29A", "#F5B942"],
  diamond: ["#1E6E8C", "#E3FBFF", "#8FE3FF"],
};

/**
 * A faceted gem/stone icon, the signature collectible of the gamification
 * layer. `earned` controls saturation/glow so unearned tiers read as
 * silhouettes on the collection screen rather than being hidden outright
 * (a student should see what's still ahead of them).
 */
export function Stone({ tier = "bronze", size = 88, earned = true, label, flavor, pulse = false }) {
  const [dark, light, mid] = TIER_GRADIENTS[tier] || TIER_GRADIENTS.bronze;
  const gradId = `stone-grad-${tier}`;

  return (
    <div className="flex flex-col items-center gap-2 w-fit">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={pulse ? "animate-stone-pulse" : ""}
        role="img"
        aria-label={label ? `${label}${earned ? "" : ", not yet earned"}` : "stone badge"}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={light} />
            <stop offset="55%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          {earned && (
            <filter id={`glow-${tier}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>
        <polygon
          points="50,4 78,22 90,52 68,90 32,90 10,52 22,22"
          fill={earned ? `url(#${gradId})` : "#2A3550"}
          stroke={earned ? light : "#3D4A6B"}
          strokeWidth="2"
          filter={earned ? `url(#glow-${tier})` : undefined}
          opacity={earned ? 1 : 0.55}
        />
        {/* facet lines */}
        <polyline points="50,4 50,90" stroke={earned ? dark : "#3D4A6B"} strokeWidth="1" opacity="0.5" />
        <polyline points="22,22 50,45 78,22" stroke={earned ? dark : "#3D4A6B"} strokeWidth="1" opacity="0.5" />
        <polyline points="10,52 50,45 90,52" stroke={earned ? dark : "#3D4A6B"} strokeWidth="1" opacity="0.5" />
      </svg>
      {label && (
        <span className={`font-display text-sm text-center ${earned ? "text-slate-800" : "text-slate-400"}`}>
          {label}
        </span>
      )}
      {flavor && earned && (
        <span className="font-body text-xs text-center text-slate-500 max-w-[10rem]">{flavor}</span>
      )}
    </div>
  );
}
