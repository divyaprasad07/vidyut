// pages/StudentHome.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { StreakFlame } from "../gamification/StreakFlame";
import { Leaderboard } from "../gamification/Leaderboard";
import { OfflineIndicator } from "../components/OfflineIndicator";

const QUIZ_MODES = [
  { id: "mixed", label: "Mixed" },
  { id: "mcq", label: "Multiple choice" },
  { id: "short", label: "Short answer" },
];
const VOICE_LANGUAGES = { en: "English", hi: "Hindi", bn: "Bengali", mr: "Marathi", ta: "Tamil", te: "Telugu" };
// When a subject's own content is genuinely written in one of the 6
// voice languages (Hindi, Bengali, Tamil are real language subjects,
// not just topics), picking that subject defaults the voice language to
// match, so read-aloud and voice answers just work without an extra
// manual step. Other subjects (Math, Science, etc.) aren't tied to a
// language, so picking those leaves the voice language as whatever the
// student already had selected.
const TOPIC_TO_VOICE_LANG = { hindi: "hi", bengali: "bn", tamil: "ta" };

export default function StudentHome() {
  const STUDENT_ID = localStorage.getItem("vidyut_student_id") || "stu_1";
  const [student, setStudent] = useState(null);
  const [topics, setTopics] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [diceChallenge, setDiceChallenge] = useState(null); // null = not rolled today yet
  const [activeTopic, setActiveTopic] = useState("math");
  const [quizMode, setQuizMode] = useState("mixed");
  const [voiceLang, setVoiceLang] = useState("en");

  useEffect(() => {
    api.student(STUDENT_ID).then(setStudent);
    api.topics().then(setTopics);
    api.allStudents().then(setAllStudents);
    api.diceStatus(STUDENT_ID).then((r) => setDiceChallenge(r.challenge));
  }, []);

  const selectTopic = (topicId) => {
    setActiveTopic(topicId);
    if (TOPIC_TO_VOICE_LANG[topicId]) setVoiceLang(TOPIC_TO_VOICE_LANG[topicId]);
  };

  if (!student) {
    return <div className="min-h-screen bg-night flex items-center justify-center text-paper font-body">Loading...</div>;
  }

  const leaderboardEntries = allStudents.map((s) => ({
    studentId: s.id,
    studentName: s.name,
    class: s.class,
    rating: s.ratings?.[activeTopic]?.rating ?? 1000,
    platinumBadges: s.platinumBadges ?? 0,
  }));

  return (
    <div className="min-h-screen bg-night px-6 py-8">
      <OfflineIndicator />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-body text-sm text-slate-400">Welcome back</p>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-paper">{student.name}</h1>
              {student.platinumBadges > 0 && (
                <span
                  className="inline-flex items-center gap-1 bg-gradient-to-br from-white to-slate-300 text-night text-xs font-display font-bold px-2 py-0.5 rounded-full shrink-0"
                  title={`${student.platinumBadges} Platinum Badge${student.platinumBadges === 1 ? "" : "s"}, a perfect score on an 8+ question Multiple Choice quiz`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 22,9 18,22 6,22 2,9" fill="currentColor" opacity="0.85" />
                  </svg>
                  {student.platinumBadges}
                </span>
              )}
            </div>
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

        <Link
          to="/dice"
          className={`flex items-center justify-between rounded-2xl px-5 py-4 mb-8 ring-1 transition ${
            diceChallenge?.passed
              ? "bg-teal/10 ring-teal/40"
              : "bg-gradient-to-br from-dusk to-night ring-slate-700 hover:ring-flame"
          }`}
        >
          <div>
            <p className="font-display text-paper">
              {diceChallenge?.passed
                ? "Today's streak secured"
                : diceChallenge
                ? "Continue today's streak challenge"
                : "Roll the dice for today's streak"}
            </p>
            <p className="font-body text-xs text-slate-400 mt-0.5">
              {diceChallenge?.passed
                ? "Come back tomorrow for a new roll."
                : diceChallenge
                ? `You rolled a ${diceChallenge.diceValue}, answer to keep your streak alive.`
                : "A quick, separate challenge, doesn't affect your topic ratings or the leaderboard."}
            </p>
          </div>
          <span className="text-3xl shrink-0 ml-3">{diceChallenge?.passed ? "\u2705" : "\u{1F3B2}"}</span>
        </Link>

        <h2 className="font-display text-lg text-paper mb-3">Pick a topic</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTopic(t.id)}
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
