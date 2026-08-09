/**
 * Design plan (frontend-design pass):
 *
 * Color — grounded in "diya against dusk", not generic AI-cream/terracotta:
 *   night      #0F172A  deep indigo-navy, the gamified student-side background
 *   dusk       #1E2A47  raised panels/cards on navy
 *   flame      #F5A623  festival-gold accent, streaks/CTAs/diamond glow warmth
 *   teal       #14B8A6  "growth" accent for science/progress, cools the gold down
 *   paper      #FBF7EE  warm off-white, teacher-dashboard background (deliberately
 *              un-gamified — the PIN gate is a register change, not just a lock)
 *   ink        #1B1B1F  body text on paper
 *
 * Tier colors (the signature "stone" badges):
 *   bronze #B08D57  silver #C7CDD4  gold #F5B942  diamond #8FE3FF
 *
 * Type — three roles, chosen for the real multilingual requirement rather
 * than decoration: Baloo 2 is a type family purpose-built with matching
 * rounded, game-friendly cuts across Devanagari/Bengali/Tamil/Telugu, so it
 * carries the "battle-royale reward screen" personality in every one of
 * the six languages, not just English. Noto Sans is the body/data face for
 * dense teacher-dashboard tables, chosen for broad, reliable Indic-script
 * coverage. JetBrains Mono is used narrowly for rating numbers and
 * leaderboard ranks, giving them a stable-width "scoreboard" feel.
 *
 * Signature element: the faceted "stone" badge (see gamification/Stone.jsx)
 * — a gem-shaped SVG with a tier gradient and a soft pulse on unlock,
 * reused across the profile screen, leaderboards, and the unlock modal.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0F172A",
        dusk: "#1E2A47",
        flame: "#F5A623",
        teal: "#14B8A6",
        paper: "#FBF7EE",
        ink: "#1B1B1F",
        tier: {
          bronze: "#B08D57",
          silver: "#C7CDD4",
          gold: "#F5B942",
          diamond: "#8FE3FF",
        },
      },
      fontFamily: {
        display: ["'Baloo 2'", "'Baloo Da 2'", "sans-serif"],
        body: ["'Noto Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        "stone-pulse": {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.04)", filter: "brightness(1.15)" },
        },
        "unlock-pop": {
          "0%": { transform: "scale(0.6) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(1.08) rotate(3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "dice-tumble": {
          "0%": { transform: "rotateX(0deg) rotateY(0deg)" },
          "25%": { transform: "rotateX(220deg) rotateY(140deg)" },
          "50%": { transform: "rotateX(410deg) rotateY(300deg)" },
          "75%": { transform: "rotateX(560deg) rotateY(480deg)" },
          "100%": { transform: "rotateX(720deg) rotateY(680deg)" },
        },
      },
      animation: {
        "stone-pulse": "stone-pulse 2.4s ease-in-out infinite",
        "unlock-pop": "unlock-pop 0.5s cubic-bezier(.2,1.4,.4,1) forwards",
        "dice-tumble": "dice-tumble 1s linear infinite",
      },
    },
  },
  plugins: [],
};
