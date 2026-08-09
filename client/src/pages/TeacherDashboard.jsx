// pages/TeacherDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Heatmap } from "../dashboard/Heatmap";
import { RatingLineChart } from "../dashboard/RatingLineChart";
import { DecliningActivityFilter } from "../dashboard/DecliningActivityFilter";
import { TeacherAttemptsTable } from "../dashboard/TeacherAttemptsTable";
import { VideoUpload } from "../dashboard/VideoUpload";
import { TeacherVideoManager } from "../dashboard/TeacherVideoManager";

const TOPICS = [
  { id: "math", name: "Mathematics" },
  { id: "science", name: "Science" },
  { id: "english", name: "English" },
  { id: "social_science", name: "Social Science" },
  { id: "hindi", name: "Hindi" },
  { id: "bengali", name: "Bengali" },
  { id: "tamil", name: "Tamil" },
];

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
  const CLASSES = ["6A", "6B", "7A", "7B", "8A", "8B"];

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

  const selectStudent = async (studentId) => {
    setSelectedStudent(studentId);
    if (!attemptsCache[studentId]) {
      const history = await api.studentHistory(studentId);
      setAttemptsCache((prev) => ({ ...prev, [studentId]: history }));
    }
  };

  const heatmapData = useMemo(() => {
    const attemptsAll = Object.values(attemptsCache).flat();
    const byClassTopic = {};
    const classes = [...new Set(students.map((s) => s.class))];
    for (const c of classes) byClassTopic[c] = {};
    // This heatmap is computed from whatever per-student history has been
    // loaded so far (loaded lazily on selection to avoid an N+1 fetch on
    // every dashboard load); a "load all" affordance would remove that
    // caveat, kept simple here on purpose per the brief.
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

  return (
    <div className="min-h-screen bg-paper px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-body text-sm text-slate-500">Teacher dashboard</p>
            <h1 className="font-display text-2xl text-ink">{teacher.name}</h1>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("teacher");
              navigate("/teacher/login");
            }}
            className="font-body text-sm text-slate-500 underline"
          >
            Sign out
          </button>
        </div>

        <section className="mb-10">
          <h2 className="font-display text-lg text-ink mb-3">Class-wide accuracy by topic</h2>
          <p className="font-body text-xs text-slate-500 mb-3">
            Click a student below to load their history and populate this heatmap; this stays a
            lazy load rather than fetching every student's full history up front.
          </p>
          <Heatmap classes={heatmapData.classes} topics={TOPICS} accuracyByClassTopic={heatmapData.byClassTopic} />
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <section>
            <h2 className="font-display text-lg text-ink mb-3">Declining activity</h2>
            <DecliningActivityFilter onSelectStudent={selectStudent} />
          </section>

          <section>
            <h2 className="font-display text-lg text-ink mb-3">Weak in topic</h2>
            <div className="flex gap-2 mb-4">
              <select
                value={weakTopic}
                onChange={(e) => setWeakTopic(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body"
              >
                {TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={weakThreshold}
                onChange={(e) => setWeakThreshold(Number(e.target.value))}
                className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body w-24"
              />
              <span className="font-body text-xs text-slate-500 self-center">rating threshold</span>
            </div>
            <ul className="flex flex-col gap-2">
              {weakResults.map((r) => (
                <li
                  key={r.studentId}
                  onClick={() => selectStudent(r.studentId)}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2 cursor-pointer hover:border-teal"
                >
                  <span className="font-body text-ink">{r.studentName}</span>
                  <span className="font-mono text-xs text-slate-500">{r.rating}</span>
                </li>
              ))}
              {weakResults.length === 0 && (
                <li className="font-body text-sm text-slate-400">No students below this threshold.</li>
              )}
            </ul>
          </section>
        </div>

        <section className="mb-10">
          <h2 className="font-display text-lg text-ink mb-3">
            Student rating leaderboard <span className="font-body text-xs text-slate-500">(teacher-only, not shown to students)</span>
          </h2>
          <ol className="grid md:grid-cols-2 gap-1">
            {leaderboard.map((s, i) => (
              <li
                key={s.studentId}
                onClick={() => selectStudent(s.studentId)}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-teal"
              >
                <span className="font-mono text-xs text-slate-400 w-6">{i + 1}</span>
                <span className="font-body text-ink flex-1">{s.studentName}</span>
                <span className="font-mono text-xs text-teal-700">{s.avgRating}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-lg text-ink mb-3">Video lecture library</h2>
          <VideoUpload topics={TOPICS} classes={CLASSES} teacherName={teacher.name} onUploaded={loadVideos} />
          <div className="mt-4">
            <TeacherVideoManager videos={videoLibrary} topics={TOPICS} classes={CLASSES} onChanged={loadVideos} />
          </div>
        </section>

        {selectedStudentObj && (
          <section>
            <h2 className="font-display text-lg text-ink mb-1">{selectedStudentObj.name}</h2>
            <p className="font-body text-xs text-slate-500 mb-4">{selectedStudentObj.class}</p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {TOPICS.map((t) => {
                const hist = selectedStudentObj.ratings?.[t.id]?.history || [];
                return hist.length > 1 ? (
                  <div key={t.id}>
                    <p className="font-body text-sm font-semibold text-ink mb-1">{t.name}</p>
                    <RatingLineChart history={hist} topicName={t.name} />
                  </div>
                ) : null;
              })}
            </div>

            <h3 className="font-display text-base text-ink mb-2">Quiz history</h3>
            <TeacherAttemptsTable attempts={selectedHistory} />
          </section>
        )}
      </div>
    </div>
  );
}
