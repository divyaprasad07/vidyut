// pages/StudentHome.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { StreakFlame } from "../gamification/StreakFlame";
import { Leaderboard } from "../gamification/Leaderboard";
import { OfflineIndicator } from "../components/OfflineIndicator";

const STUDENT_ID = "stu_1";
const QUIZ_MODES = [
  { id: "mixed", label: "Mixed" },
  { id: "mcq", label: "Multiple choice" },
  { id: "short", label: "Short answer" },
];
const VOICE_LANGUAGES = { en: "English", hi: "Hindi", bn: "Bengali", mr: "Marathi", ta: "Tamil", te: "Telugu" };

export default function StudentHome() {
  const [student, setStudent] = useState(null);
  const [topics, setTopics] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeTopic, setActiveTopic] = useState("math");
  const [quizMode, setQuizMode] = useState("mixed");
  const [voiceLang, setVoiceLang] = useState("en");

  useEffect(() => {
    api.student(STUDENT_ID).then(setStudent);
    api.topics().then(setTopics);
    api.allStudents().then(setAllStudents);
  }, []);

  if (!student) {
    return <div className="min-h-screen bg-night flex items-center justify-center text-paper font-body">Loading...</div>;
  }

  const leaderboardEntries = allStudents.map((s) => ({
    studentId: s.id,
    studentName: s.name,
    class: s.class,
    rating: s.ratings?.[activeTopic]?.rating ?? 1000,
  }));

  return (
    <div className="min-h-screen bg-night px-6 py-8">
      <OfflineIndicator />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-body text-sm text-slate-400">Welcome back</p>
            <h1 className="font-display text-2xl text-paper">{student.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <StreakFlame current={student.streak.current} longest={student.streak.longest} />
            <Link
              to="/videos"
              className="w-11 h-11 rounded-full bg-dusk ring-1 ring-slate-700 flex items-center justify-center text-slate-300"
              aria-label="Video lectures"
              title="Video lectures"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M18 9.5l4-2.5v10l-4-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              to="/profile"
              className="w-11 h-11 rounded-full bg-flame/20 ring-2 ring-flame flex items-center justify-center font-display text-flame"
            >
              {student.name.charAt(0)}
            </Link>
          </div>
        </div>

        <h2 className="font-display text-lg text-paper mb-3">Pick a topic</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-body text-sm transition ${
                activeTopic === t.id ? "bg-flame text-night font-semibold" : "bg-dusk text-slate-300"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-dusk to-night rounded-2xl p-6 mb-8 ring-1 ring-slate-700">
          <p className="font-body text-sm text-slate-400 mb-1">Current rating</p>
          <p className="font-mono text-3xl text-teal mb-4">
            {student.ratings?.[activeTopic]?.rating ?? 1000}
          </p>

          <p className="font-body text-xs text-slate-400 mb-2">Question style</p>
          <div className="flex gap-2 mb-5">
            {QUIZ_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setQuizMode(m.id)}
                className={`px-3 py-1.5 rounded-full font-body text-sm transition ${
                  quizMode === m.id ? "bg-teal text-night font-semibold" : "bg-night text-slate-300 ring-1 ring-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p className="font-body text-xs text-slate-400 mb-2">Voice language</p>
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value)}
            className="bg-night text-paper font-body text-sm rounded-full px-3 py-1.5 ring-1 ring-slate-700 mb-5"
          >
            {Object.entries(VOICE_LANGUAGES).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          <div>
            <Link
              to={`/quiz/${activeTopic}?mode=${quizMode}&voice=${voiceLang}`}
              className="inline-block bg-flame text-night font-display font-semibold px-6 py-3 rounded-full"
            >
              Start adaptive quiz
            </Link>
          </div>
        </div>

        <Leaderboard
          entries={leaderboardEntries}
          currentStudentClass={student.class}
          currentStudentId={STUDENT_ID}
          topicName={topics.find((t) => t.id === activeTopic)?.name ?? ""}
        />
      </div>
    </div>
  );
}
