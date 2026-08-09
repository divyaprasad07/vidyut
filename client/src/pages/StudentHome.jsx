// pages/StudentHome.jsx
//
// Redesigned to the sky/glassmorphic look from the provided mockup, but
// every number on this screen is real: streak, rating, momentum minutes,
// leaderboard, dice status, all fetched from the actual API, none of the
// mockup's fabricated "XP"/"coins"/"65% syllabus" stats made it in, see
// the README for the substitution notes.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Leaderboard } from "../gamification/Leaderboard";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { MomentumChart } from "../dashboard/MomentumChart";

const QUIZ_MODES = [
  { id: "mixed", label: "Mixed" },
  { id: "mcq", label: "Multiple choice" },
  { id: "short", label: "Short answer" },
];
const VOICE_LANGUAGES = { en: "English", hi: "Hindi", bn: "Bengali", mr: "Marathi", ta: "Tamil", te: "Telugu" };
const TOPIC_TO_VOICE_LANG = { hindi: "hi", bengali: "bn", tamil: "ta" };

export default function StudentHome() {
  const STUDENT_ID = localStorage.getItem("vidyut_student_id") || "stu_1";
  const [student, setStudent] = useState(null);
  const [topics, setTopics] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [diceChallenge, setDiceChallenge] = useState(null);
  const [momentum, setMomentum] = useState([]);
  const [activeTopic, setActiveTopic] = useState("math");
  const [quizMode, setQuizMode] = useState("mixed");
  const [voiceLang, setVoiceLang] = useState("en");

  useEffect(() => {
    api.student(STUDENT_ID).then(setStudent);
    api.topics().then(setTopics);
    api.allStudents().then(setAllStudents);
    api.diceStatus(STUDENT_ID).then((r) => setDiceChallenge(r.challenge));
    api.momentum(STUDENT_ID).then(setMomentum);
  }, []);

  const selectTopic = (topicId) => {
    setActiveTopic(topicId);
    if (TOPIC_TO_VOICE_LANG[topicId]) setVoiceLang(TOPIC_TO_VOICE_LANG[topicId]);
  };

  if (!student) {
    return <div className="min-h-screen sky-gradient flex items-center justify-center font-body text-slate-500">Loading...</div>;
  }

  const leaderboardEntries = allStudents.map((s) => ({
    studentId: s.id,
    studentName: s.name,
    class: s.class,
    rating: s.ratings?.[activeTopic]?.rating ?? 1000,
    platinumBadges: s.platinumBadges ?? 0,
  }));

  // A real, small "topics with real progress" count for the sidebar box,
  // replacing the mockup's fabricated "65% syllabus finished" bar.
  const topicsStarted = Object.values(student.ratings || {}).filter((r) => r.rating !== 1000 || (r.history || []).length > 0).length;

  return (
    <div className="sky-gradient min-h-screen font-sans text-slate-800 overflow-x-hidden relative">
      <OfflineIndicator />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="cloud w-64 h-24 top-20" style={{ animationDuration: "120s", left: "-10%" }} />
        <div className="cloud w-96 h-32 top-64" style={{ animationDuration: "180s", left: "-20%" }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 bg-white/60 backdrop-blur-xl border-r border-white/40 p-8 flex-col gap-10 h-screen sticky top-0">
          <div className="text-3xl font-display font-bold text-[#008080] flex items-center gap-2">
            <i className="fa-solid fa-bolt-lightning"></i> Vidyut
          </div>
          <nav className="flex flex-col gap-3">
            <span className="flex items-center gap-4 p-4 rounded-2xl bg-[#008080] text-white shadow-xl shadow-[#008080]/20">
              <i className="fa-solid fa-house text-lg"></i> <span className="font-bold">Home</span>
            </span>
            <Link to="/videos" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/60 text-slate-600 transition-all group">
              <i className="fa-solid fa-video text-lg group-hover:text-[#008080]"></i> <span className="font-medium">Video Library</span>
            </Link>
            <a href="#leaderboard" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/60 text-slate-600 transition-all group">
              <i className="fa-solid fa-ranking-star text-lg group-hover:text-[#008080]"></i> <span className="font-medium">Leaderboard</span>
            </a>
            <Link to="/dice" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/60 text-slate-600 transition-all group">
              <i className="fa-solid fa-dice text-lg group-hover:text-[#008080]"></i> <span className="font-medium">Dice Challenge</span>
            </Link>
            <Link to="/profile" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/60 text-slate-600 transition-all group">
              <i className="fa-solid fa-user text-lg group-hover:text-[#008080]"></i> <span className="font-medium">Profile</span>
            </Link>
          </nav>

          <div className="mt-auto">
            <div className="p-6 bg-[#E0F2F2] rounded-[24px] border border-[#008080]/10">
              <div className="text-[10px] font-bold text-[#008080]/60 uppercase tracking-widest mb-2">Your Class</div>
              <div className="text-xl font-display font-bold text-[#008080] mb-4">{student.class}</div>
              <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#008080] h-full" style={{ width: `${Math.min(100, (topicsStarted / (topics.length || 1)) * 100)}%` }} />
              </div>
              <div className="text-[10px] font-bold text-[#008080]/60 mt-2">{topicsStarted} of {topics.length} subjects started</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <header className="flex flex-wrap justify-between items-center gap-6 mb-10">
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-800 mb-2">Namaste, {student.name.split(" ")[0]}!</h1>
              <p className="text-base md:text-lg text-slate-500 font-medium">Ready to break your records today?</p>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
              <div className="streak-container px-5 md:px-8 py-3 md:py-4 rounded-[24px] flex items-center gap-4 md:gap-5 shadow-xl shadow-amber-500/10 border border-white">
                <i className="fa-solid fa-fire text-3xl md:text-5xl text-amber-500 flame-glow"></i>
                <div className="flex flex-col">
                  <span className="text-2xl md:text-4xl font-mono font-bold text-slate-800 leading-none">{student.streak.current}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Day Streak</span>
                </div>
              </div>
              {student.platinumBadges > 0 && (
                <span
                  className="hidden sm:inline-flex items-center gap-1 bg-gradient-to-br from-white to-slate-300 text-slate-700 text-xs font-display font-bold px-3 py-1.5 rounded-full border border-slate-200"
                  title={`${student.platinumBadges} Platinum Badge${student.platinumBadges === 1 ? "" : "s"}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polygon points="12,2 22,9 18,22 6,22 2,9" fill="currentColor" opacity="0.85" /></svg>
                  {student.platinumBadges}
                </span>
              )}
              <Link to="/profile" className="relative group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-3xl border-4 border-white shadow-xl bg-[#008080]/20 flex items-center justify-center font-display text-xl text-[#008080] group-hover:scale-105 transition-transform">
                  {student.name.charAt(0)}
                </div>
              </Link>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Left column */}
            <div className="lg:col-span-8 space-y-8 lg:space-y-10">
              <div className="glass-card rounded-[40px] p-6 md:p-10">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-slate-800">Learning Momentum</h2>
                  <p className="text-sm text-slate-500 font-medium">Minutes spent on quizzes, last 7 days</p>
                </div>
                <MomentumChart data={momentum} />
              </div>

              <div className="glass-card rounded-[40px] p-6 md:p-10">
                <h2 className="text-xl md:text-2xl font-display font-bold text-slate-800 mb-6">Pick a topic</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => selectTopic(t.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full font-body text-sm transition ${
                        activeTopic === t.id ? "bg-[#008080] text-white font-semibold" : "bg-white/60 text-slate-600"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="bg-white/50 rounded-[28px] p-6 border border-white/60">
                  <p className="font-body text-sm text-slate-500 mb-1">Current rating</p>
                  <p className="font-mono text-3xl text-[#008080] font-bold mb-5">
                    {student.ratings?.[activeTopic]?.rating ?? 1000}
                  </p>

                  <p className="font-body text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">Question style</p>
                  <div className="flex gap-2 mb-5">
                    {QUIZ_MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setQuizMode(m.id)}
                        className={`px-3 py-1.5 rounded-full font-body text-sm transition ${
                          quizMode === m.id ? "bg-slate-800 text-white font-semibold" : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <p className="font-body text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">Voice language</p>
                  <select
                    value={voiceLang}
                    onChange={(e) => setVoiceLang(e.target.value)}
                    className="bg-white text-slate-700 font-body text-sm rounded-full px-3 py-1.5 border border-slate-200 mb-6"
                  >
                    {Object.entries(VOICE_LANGUAGES).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>

                  <div>
                    <Link
                      to={`/quiz/${activeTopic}?mode=${quizMode}&voice=${voiceLang}`}
                      className="inline-flex items-center gap-2 bg-[#008080] hover:bg-[#008080]/90 text-white font-display font-semibold px-6 py-3 rounded-full shadow-lg shadow-[#008080]/30 transition"
                    >
                      Start adaptive quiz <i className="fa-solid fa-arrow-right text-sm"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-4 space-y-8 lg:space-y-10">
              <Link
                to="/dice"
                className="block relative overflow-hidden bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl group"
              >
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-2">Dice Challenge</h3>
                <p className="text-slate-400 font-medium mb-6 leading-relaxed text-sm">
                  {diceChallenge?.passed
                    ? "Today's streak is already secured, come back tomorrow."
                    : diceChallenge
                    ? `You rolled a ${diceChallenge.diceValue}, finish answering to keep your streak.`
                    : "Roll the 3D dice, answer that many questions, keep your streak alive."}
                </p>
                <span className="w-full inline-flex items-center justify-center gap-3 bg-[#008080] group-hover:bg-[#008080]/90 text-white py-3.5 rounded-[20px] font-bold transition-all shadow-lg shadow-[#008080]/30">
                  {diceChallenge?.passed ? "Streak secured" : "Roll the dice"}
                  <i className="fa-solid fa-dice-five"></i>
                </span>
                <div className="absolute right-[-30px] bottom-[-20px] opacity-10 group-hover:opacity-20 transition-all duration-700 transform group-hover:rotate-45 group-hover:scale-110">
                  <i className="fa-solid fa-dice text-[160px]"></i>
                </div>
              </Link>

              <div id="leaderboard">
                <Leaderboard
                  entries={leaderboardEntries}
                  currentStudentClass={student.class}
                  currentStudentId={STUDENT_ID}
                  topicName={topics.find((t) => t.id === activeTopic)?.name ?? ""}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
