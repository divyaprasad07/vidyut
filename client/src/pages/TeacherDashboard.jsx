// pages/TeacherDashboard.jsx
//
// Redesigned to the blackboard/chalk theme from the provided mockup.
// Every existing feature (roster, heatmap, declining/weak filters,
// teacher-only leaderboard, video management, per-student detail) is
// unchanged in logic, only the visual shell changed. The metrics row is
// new and entirely real (server-computed from actual ratings/attempts,
// see GET /api/teacher/overview), replacing the mockup's fabricated
// "74.2% mastery / 1,842 questions this week" placeholder numbers.
// Existing sub-components (Heatmap, RatingLineChart, etc.) keep their
// original light card styling and sit inside dark panels here, a
// deliberate "dark chrome, light content cards" pattern rather than
// restyling every nested component individually.

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Heatmap } from "../dashboard/Heatmap";
import { RatingLineChart } from "../dashboard/RatingLineChart";
import { DecliningActivityFilter } from "../dashboard/DecliningActivityFilter";
import { TeacherAttemptsTable } from "../dashboard/TeacherAttemptsTable";
import { VideoUpload } from "../dashboard/VideoUpload";
import { TeacherVideoManager } from "../dashboard/TeacherVideoManager";
import { CLASSES } from "../constants";

const TOPICS = [
  { id: "math", name: "Mathematics" },
  { id: "science", name: "Science" },
  { id: "english", name: "English" },
  { id: "social_science", name: "Social Science" },
  { id: "hindi", name: "Hindi" },
  { id: "bengali", name: "Bengali" },
  { id: "tamil", name: "Tamil" },
];

function Panel({ id, title, subtitle, action, children }) {
  return (
    <section id={id} className="bg-[#242D29] border border-[#2F3834] rounded p-6 mb-8 scroll-mt-6">
      <div className="flex justify-between items-start mb-5 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-display font-bold text-[#F5F5F5]">{title}</h2>
          {subtitle && <p className="text-[#F5F5F5]/40 text-xs mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [attemptsCache, setAttemptsCache] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [weakTopic, setWeakTopic] = useState("math");
  const [weakThreshold, setWeakThreshold] = useState(1050);
  const [weakResults, setWeakResults] = useState([]);
  const [videoLibrary, setVideoLibrary] = useState([]);
  const [rosterClass, setRosterClass] = useState(CLASSES[0]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [overview, setOverview] = useState(null);

  const loadVideos = () => api.videos({}).then(setVideoLibrary);

  useEffect(() => {
    const stored = sessionStorage.getItem("teacher");
    if (!stored) {
      navigate("/teacher/login");
      return;
    }
    setTeacher(JSON.parse(stored));
    api.allStudents().then(setStudents);
    api.leaderboard().then(setLeaderboard);
    loadVideos();
  }, [navigate]);

  useEffect(() => {
    api.weakInTopic(weakTopic, weakThreshold).then(setWeakResults);
  }, [weakTopic, weakThreshold]);

  // Real, class-scoped metrics for the header row, refetched whenever the
  // roster class changes so "Active Students" etc. reflect the class
  // currently being viewed.
  useEffect(() => {
    api.teacherOverview(rosterClass).then(setOverview);
  }, [rosterClass]);

  const selectStudent = async (studentId) => {
    setSelectedStudent(studentId);
    setSelectedProfile(null);
    if (!attemptsCache[studentId]) {
      const history = await api.studentHistory(studentId);
      setAttemptsCache((prev) => ({ ...prev, [studentId]: history }));
    }
    api.student(studentId).then(setSelectedProfile);
  };

  const rosterStudents = useMemo(() => {
    return students
      .filter((s) => s.class === rosterClass)
      .map((s) => {
        const ratingValues = Object.values(s.ratings || {}).map((r) => r.rating);
        const avgRating = ratingValues.length
          ? Math.round(ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length)
          : 1000;
        return { ...s, avgRating };
      })
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [students, rosterClass]);

  const heatmapData = useMemo(() => {
    const attemptsAll = Object.values(attemptsCache).flat();
    const byClassTopic = {};
    const classes = [...new Set(students.map((s) => s.class))];
    for (const c of classes) byClassTopic[c] = {};
    for (const c of classes) {
      for (const t of TOPICS) {
        const relevant = attemptsAll.filter((a) => {
          const student = students.find((s) => s.class === c && attemptsCache[s.id]?.includes(a));
          return student && a.topicId === t.id;
        });
        byClassTopic[c][t.id] = relevant.length
          ? Math.round(
              (relevant.reduce((s, a) => s + a.score / a.questionsAttempted, 0) / relevant.length) * 100
            )
          : null;
      }
    }
    return { classes, byClassTopic };
  }, [attemptsCache, students]);

  if (!teacher) return null;

  const selectedHistory = selectedStudent ? attemptsCache[selectedStudent] || [] : [];
  const selectedStudentObj = students.find((s) => s.id === selectedStudent);
  const riskColor = { LOW: "text-[#80CBC4]", MEDIUM: "text-[#FFF9C4]", HIGH: "text-[#FFAB91]" };

  return (
    <div className="blackboard-bg min-h-screen font-sans text-[#F5F5F5] antialiased">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 bg-[#242D29] border-r border-[#2F3834] p-6 flex-col gap-8 h-screen sticky top-0">
          <div className="text-2xl font-display font-bold text-[#FFF9C4] flex items-center gap-2">
            <i className="fa-solid fa-chalkboard-user"></i> Vidyut <span className="text-xs font-sans opacity-60 uppercase">Teacher</span>
          </div>
          <nav className="flex flex-col gap-1">
            <span className="flex items-center gap-3 p-3 rounded bg-white/5 border-l-2 border-[#FFF9C4]">
              <i className="fa-solid fa-chart-line text-sm text-[#FFF9C4]"></i> <span className="font-bold text-sm">Class Overview</span>
            </span>
            <a href="#roster" className="flex items-center gap-3 p-3 rounded hover:bg-white/5 text-[#F5F5F5]/60 transition-all">
              <i className="fa-solid fa-users text-sm"></i> <span className="font-medium text-sm">Student Roster</span>
            </a>
            <a href="#videos" className="flex items-center gap-3 p-3 rounded hover:bg-white/5 text-[#F5F5F5]/60 transition-all">
              <i className="fa-solid fa-video text-sm"></i> <span className="font-medium text-sm">Video Library</span>
            </a>
          </nav>
          <div className="mt-auto">
            <div className="p-4 rounded border border-[#2F3834] bg-black/20">
              <div className="text-[10px] font-bold text-[#F5F5F5]/40 uppercase mb-2">Viewing Class</div>
              <div className="text-sm font-bold text-[#F5F5F5] mb-1">{rosterClass}</div>
              <div className="text-xs text-[#F5F5F5]/60">{overview?.totalStudents ?? "..."} students enrolled</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-8">
          <header className="flex justify-between items-center mb-8 border-b border-[#2F3834] pb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-[#F5F5F5]">Performance Dashboard</h1>
              <p className="text-[#F5F5F5]/40 text-sm">Welcome, {teacher.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={rosterClass}
                onChange={(e) => setRosterClass(e.target.value)}
                className="bg-[#242D29] border border-[#2F3834] rounded px-3 py-2 text-sm font-body text-[#F5F5F5]"
              >
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => {
                  sessionStorage.removeItem("teacher");
                  navigate("/teacher/login");
                }}
                className="text-xs font-bold text-[#F5F5F5]/50 uppercase tracking-widest hover:text-[#F5F5F5]"
              >
                Sign out
              </button>
            </div>
          </header>

          {/* Real metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
            <div className="bg-[#242D29] p-5 rounded border border-[#2F3834]">
              <div className="text-[10px] font-bold text-[#F5F5F5]/40 uppercase mb-3">Average Mastery</div>
              <span className="text-3xl font-mono font-bold text-[#80CBC4]">{overview ? `${overview.avgMastery}%` : "..."}</span>
            </div>
            <div className="bg-[#242D29] p-5 rounded border border-[#2F3834]">
              <div className="text-[10px] font-bold text-[#F5F5F5]/40 uppercase mb-3">Active Today</div>
              <span className="text-3xl font-mono font-bold text-[#F5F5F5]">
                {overview ? overview.activeToday : "..."}<span className="text-sm opacity-40">/{overview?.totalStudents ?? "-"}</span>
              </span>
            </div>
            <div className="bg-[#242D29] p-5 rounded border border-[#2F3834]">
              <div className="text-[10px] font-bold text-[#F5F5F5]/40 uppercase mb-3">Questions Solved</div>
              <span className="text-3xl font-mono font-bold text-[#FFF9C4]">{overview ? overview.questionsSolvedThisWeek : "..."}</span>
              <span className="text-[10px] text-[#F5F5F5]/40 font-bold block mt-1">This Week</span>
            </div>
            <div className="bg-[#242D29] p-5 rounded border border-[#2F3834]">
              <div className="text-[10px] font-bold text-[#F5F5F5]/40 uppercase mb-3">Risk Level</div>
              <span className={`text-3xl font-mono font-bold ${overview ? riskColor[overview.riskLevel] : "text-[#F5F5F5]"}`}>
                {overview ? overview.riskLevel : "..."}
              </span>
              <span className="text-[10px] text-[#F5F5F5]/40 font-bold block mt-1">{overview?.decliningCount ?? 0} declining</span>
            </div>
          </div>

          <Panel
            id="roster"
            title="Student Roster"
            subtitle="Real signed-up students and any seed data side by side, sorted by average rating."
          >
            <div className="grid md:grid-cols-2 gap-2">
              {rosterStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => selectStudent(s.id)}
                  className={`flex items-center justify-between bg-white border rounded-lg px-4 py-3 cursor-pointer transition ${
                    selectedStudent === s.id ? "border-teal-500 ring-1 ring-teal-500" : "border-slate-200 hover:border-teal-400"
                  }`}
                >
                  <div>
                    <p className="font-body font-semibold text-slate-800 text-sm">{s.name}</p>
                    <p className="font-mono text-xs text-slate-400 mt-0.5">Avg rating {s.avgRating}</p>
                  </div>
                  {s.platinumBadges > 0 && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-br from-white to-slate-300 text-slate-700 text-[10px] font-display font-bold px-2 py-0.5 rounded-full ring-1 ring-slate-300">
                      {s.platinumBadges} platinum
                    </span>
                  )}
                </div>
              ))}
              {rosterStudents.length === 0 && (
                <p className="font-body text-sm text-[#F5F5F5]/40">No students in {rosterClass} yet.</p>
              )}
            </div>
          </Panel>

          <Panel
            title="Class-wide Accuracy by Topic"
            subtitle="Click a student below to load their history and populate this heatmap."
          >
            <div className="bg-white rounded-lg p-4">
              <Heatmap classes={heatmapData.classes} topics={TOPICS} accuracyByClassTopic={heatmapData.byClassTopic} />
            </div>
          </Panel>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Panel title="Declining Activity">
              <div className="bg-white rounded-lg p-4">
                <DecliningActivityFilter onSelectStudent={selectStudent} />
              </div>
            </Panel>

            <Panel title="Weak in Topic">
              <div className="flex gap-2 mb-4">
                <select
                  value={weakTopic}
                  onChange={(e) => setWeakTopic(e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body"
                >
                  {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input
                  type="number"
                  value={weakThreshold}
                  onChange={(e) => setWeakThreshold(Number(e.target.value))}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body w-24"
                />
                <span className="font-body text-xs text-[#F5F5F5]/50 self-center">rating threshold</span>
              </div>
              <ul className="flex flex-col gap-2">
                {weakResults.map((r) => (
                  <li
                    key={r.studentId}
                    onClick={() => selectStudent(r.studentId)}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2 cursor-pointer hover:border-teal-400"
                  >
                    <span className="font-body text-slate-800">{r.studentName}</span>
                    <span className="font-mono text-xs text-slate-500">{r.rating}</span>
                  </li>
                ))}
                {weakResults.length === 0 && (
                  <li className="font-body text-sm text-[#F5F5F5]/40">No students below this threshold.</li>
                )}
              </ul>
            </Panel>
          </div>

          <Panel title="Student Rating Leaderboard" subtitle="Teacher-only, not shown to students.">
            <ol className="grid md:grid-cols-2 gap-1">
              {leaderboard.map((s, i) => (
                <li
                  key={s.studentId}
                  onClick={() => selectStudent(s.studentId)}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-teal-400"
                >
                  <span className="font-mono text-xs text-slate-400 w-6">{i + 1}</span>
                  <span className="font-body text-slate-800 flex-1">{s.studentName}</span>
                  <span className="font-mono text-xs text-teal-700">{s.avgRating}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel id="videos" title="Video Lecture Library">
            <VideoUpload topics={TOPICS} classes={CLASSES} teacherName={teacher.name} onUploaded={loadVideos} />
            <div className="mt-4">
              <TeacherVideoManager videos={videoLibrary} topics={TOPICS} classes={CLASSES} onChanged={loadVideos} />
            </div>
          </Panel>

          {selectedStudentObj && (
            <Panel title={selectedStudentObj.name} subtitle={selectedProfile?.email || selectedStudentObj.class}>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {TOPICS.map((t) => {
                  const hist = selectedStudentObj.ratings?.[t.id]?.history || [];
                  return hist.length > 1 ? (
                    <div key={t.id} className="bg-white rounded-lg p-4">
                      <p className="font-body text-sm font-semibold text-slate-800 mb-1">{t.name}</p>
                      <RatingLineChart history={hist} topicName={t.name} />
                    </div>
                  ) : null;
                })}
              </div>
              <h3 className="font-display text-base text-[#F5F5F5] mb-2">Quiz history</h3>
              <div className="bg-white rounded-lg p-4">
                <TeacherAttemptsTable attempts={selectedHistory} />
              </div>
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}
