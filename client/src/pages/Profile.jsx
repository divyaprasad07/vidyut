// pages/Profile.jsx
//
// Redesigned to the glassmorphic sky theme from the provided mockup.
// Several mockup elements were fabricated (Total XP, "CBSE Board", "Top
// 5%", fake Personal Info/Notifications/Privacy links to nowhere) and
// were deliberately replaced with real data or real, working actions,
// see the inline notes at each substitution.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Stone } from "../gamification/Stone";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { STUDENT_ID_KEY, STUDENT_NAME_KEY } from "./Landing";

const TIER_ORDER = ["bronze", "silver", "gold", "diamond"];

export default function Profile() {
  const STUDENT_ID = localStorage.getItem(STUDENT_ID_KEY) || "stu_1";
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [badgeData, setBadgeData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.student(STUDENT_ID).then(setStudent);
    api.badges(STUDENT_ID).then(setBadgeData);
    // Real recent activity, the same quiz-history endpoint the teacher
    // dashboard uses, there's no reason a student can't see their own.
    api.studentHistory(STUDENT_ID).then((h) => setHistory(h.slice(0, 6)));
  }, []);

  const signOut = () => {
    localStorage.removeItem(STUDENT_ID_KEY);
    localStorage.removeItem(STUDENT_NAME_KEY);
    navigate("/");
  };

  if (!student || !badgeData) {
    return <div className="min-h-screen sky-gradient flex items-center justify-center font-body text-slate-500">Loading...</div>;
  }

  const totalStones = badgeData.badges.reduce((sum, b) => sum + b.tiers.length, 0);
  const ratingValues = Object.values(student.ratings || {}).map((r) => r.rating);
  const avgRating = ratingValues.length ? Math.round(ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) : 1000;

  return (
    <div className="sky-gradient min-h-screen font-sans text-slate-800 p-6 md:p-10">
      <OfflineIndicator />
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="text-2xl md:text-3xl font-display font-bold text-[#008080] flex items-center gap-2">
            <i className="fa-solid fa-bolt-lightning"></i> Vidyut
          </div>
          <a href="/home" className="flex items-center gap-2 font-bold text-[#008080] hover:underline text-sm">
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left column: identity */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-card rounded-[40px] p-8 text-center shadow-xl shadow-sky-900/5">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[48px] border-8 border-white shadow-2xl mx-auto bg-[#008080]/15 flex items-center justify-center font-display text-5xl text-[#008080]">
                  {student.name.charAt(0)}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#008080] text-white w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold border-4 border-white">
                  {student.streak.current}
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">{student.name}</h1>
              <p className="text-slate-500 font-medium mb-6">Class {student.class}</p>

              <div className="flex justify-center gap-3 flex-wrap">
                {/* Real class pill, replaces the mockup's fabricated "CBSE Board" */}
                <div className="px-4 py-2 bg-[#E0F2F2] rounded-xl text-[#008080] text-xs font-bold uppercase tracking-widest">
                  {student.class}
                </div>
                {/* Real platinum badge count, replaces the mockup's fabricated "Top 5%" */}
                {student.platinumBadges > 0 && (
                  <div className="px-4 py-2 bg-amber-100 rounded-xl text-amber-600 text-xs font-bold uppercase tracking-widest">
                    {student.platinumBadges} Platinum
                  </div>
                )}
              </div>
            </div>

            {/* Real, working actions, replaces the mockup's dead
                Personal Info / Notifications / Privacy links */}
            <div className="glass-card rounded-[32px] p-6 shadow-lg shadow-sky-900/5">
              <h3 className="text-lg font-display font-bold mb-4 px-2">Account</h3>
              <nav className="space-y-1">
                <a href="/home" className="flex items-center justify-between p-4 rounded-2xl bg-white/60 font-bold text-[#008080]">
                  <span className="flex items-center gap-3"><i className="fa-solid fa-house"></i> Home</span>
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </a>
                <a href="/videos" className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/40 font-medium text-slate-600">
                  <span className="flex items-center gap-3"><i className="fa-solid fa-video"></i> Video Library</span>
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </a>
                <button
                  onClick={signOut}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/40 font-medium text-red-500 text-left"
                >
                  <span className="flex items-center gap-3"><i className="fa-solid fa-right-from-bracket"></i> Sign out</span>
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </nav>
            </div>
          </div>

          {/* Right column: achievements + activity */}
          <div className="lg:col-span-8 space-y-8 lg:space-y-10">
            {/* Real stats, replaces the mockup's fabricated Total XP / Avg Accuracy */}
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              <div className="glass-card rounded-[32px] p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-display font-bold text-[#008080] mb-1">{avgRating}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Rating</div>
              </div>
              <div className="glass-card rounded-[32px] p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-display font-bold text-amber-500 mb-1">{student.streak.current}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day Streak</div>
              </div>
              <div className="glass-card rounded-[32px] p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-display font-bold text-emerald-500 mb-1">{totalStones}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stones Earned</div>
              </div>
            </div>

            {/* Real per-topic mastery stones */}
            <div className="glass-card rounded-[40px] p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-display font-bold">My Stone Badges</h2>
                <span className="text-xs font-bold text-[#008080] uppercase tracking-widest">{totalStones} Unlocked</span>
              </div>
              <div className="flex flex-col gap-6">
                {badgeData.badges.map((topicBadge) => (
                  <div key={topicBadge.topic}>
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="font-display text-slate-800 font-bold text-sm">{topicBadge.topicName}</h3>
                      <span className="font-mono text-xs text-slate-400">
                        {topicBadge.masteryPercent}% mastery
                      </span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {TIER_ORDER.map((tierId) => {
                        const meta = badgeData.allTiers.find((t) => t.id === tierId);
                        const earned = topicBadge.tiers.some((t) => t.id === tierId);
                        return (
                          <div key={tierId} className="bg-white/40 rounded-2xl p-3 border border-white/60">
                            <Stone tier={tierId} size={56} earned={earned} label={meta.label.replace(" Stone", "")} pulse={earned && tierId === "diamond"} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real recent activity, from actual quiz attempts */}
            <div className="glass-card rounded-[40px] p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-display font-bold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {history.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/40 transition-all border border-transparent hover:border-white/60">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-[#008080]">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm capitalize">{a.topicId.replace("_", " ")} quiz</div>
                      <div className="text-xs text-slate-400">
                        {new Date(a.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {a.autoSubmitted && " · auto-submitted"}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[#008080] bg-[#E0F2F2] px-3 py-1 rounded-lg font-mono">
                      {a.score}/{a.questionsAttempted}
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="font-body text-sm text-slate-400 text-center py-6">No quizzes taken yet, start one from the home screen.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
