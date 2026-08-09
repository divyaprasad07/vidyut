// pages/VideoLibrary.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { OfflineIndicator } from "../components/OfflineIndicator";

const STUDENT_ID = "stu_1";
const LANGUAGE_LABELS = { en: "English", hi: "Hindi", bn: "Bengali", mr: "Marathi", ta: "Tamil", te: "Telugu" };

export default function VideoLibrary() {
  const [student, setStudent] = useState(null);
  const [topics, setTopics] = useState([]);
  const [videos, setVideos] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [playingLanguage, setPlayingLanguage] = useState(null);

  useEffect(() => {
    api.student(STUDENT_ID).then(setStudent);
    api.topics().then(setTopics);
  }, []);

  useEffect(() => {
    if (!student) return;
    const filters = { class: student.class };
    if (subjectFilter) filters.subject = subjectFilter;
    if (languageFilter) filters.language = languageFilter;
    api.videos(filters).then(setVideos);
  }, [student, subjectFilter, languageFilter]);

  if (!student) {
    return <div className="min-h-screen bg-night flex items-center justify-center text-paper font-body">Loading...</div>;
  }

  const playing = videos.find((v) => v.id === playingId);
  // Default to whichever language the student filtered by, if that lecture
  // has it, otherwise the first available track. The student can still
  // switch freely afterward, independent of whatever language the teacher
  // originally recorded in.
  const activeTrack = playing?.tracks.find((t) => t.language === playingLanguage) || playing?.tracks[0];

  const startPlaying = (video) => {
    setPlayingId(video.id);
    const preferred = video.tracks.find((t) => t.language === languageFilter);
    setPlayingLanguage((preferred || video.tracks[0]).language);
  };

  return (
    <div className="min-h-screen bg-night px-6 py-8">
      <OfflineIndicator />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-body text-sm text-slate-400">{student.class}</p>
            <h1 className="font-display text-2xl text-paper">Video lectures</h1>
          </div>
          <Link to="/" className="font-body text-sm text-slate-400 underline">
            Back home
          </Link>
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-dusk text-paper font-body text-sm rounded-full px-4 py-2 ring-1 ring-slate-700"
          >
            <option value="">All subjects</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-dusk text-paper font-body text-sm rounded-full px-4 py-2 ring-1 ring-slate-700"
          >
            <option value="">Any language available</option>
            {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        {playing && activeTrack && (
          <div className="bg-dusk rounded-2xl p-4 mb-8">
            <video
              key={`${playing.id}-${activeTrack.language}`}
              controls
              autoPlay
              className="w-full rounded-xl bg-black"
              src={activeTrack.storageUrl}
            >
              {activeTrack.captionsUrl && (
                <track kind="captions" src={activeTrack.captionsUrl} srcLang={activeTrack.language} default />
              )}
            </video>
            <div className="mt-3">
              <p className="font-display text-paper">{playing.title}</p>
              <p className="font-body text-xs text-slate-400 mt-1">
                {playing.teacherName} · {new Date(playing.uploadTimestamp).toLocaleDateString("en-IN")}
                {!activeTrack.captionsUrl && " · no captions available in this language"}
              </p>

              {playing.tracks.length > 1 && (
                <div className="mt-3">
                  <p className="font-body text-xs text-slate-400 mb-1.5">Watch in</p>
                  <div className="flex gap-2 flex-wrap">
                    {playing.tracks.map((t) => (
                      <button
                        key={t.language}
                        onClick={() => setPlayingLanguage(t.language)}
                        className={`px-3 py-1 rounded-full font-body text-xs transition ${
                          activeTrack.language === t.language
                            ? "bg-teal text-night font-semibold"
                            : "bg-night text-slate-300 ring-1 ring-slate-700"
                        }`}
                      >
                        {LANGUAGE_LABELS[t.language] || t.language}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {videos.map((v) => (
            <button
              key={v.id}
              onClick={() => startPlaying(v)}
              className={`text-left bg-dusk rounded-xl px-4 py-3 ring-1 transition ${
                playingId === v.id ? "ring-flame" : "ring-slate-700 hover:ring-teal"
              }`}
            >
              <p className="font-display text-paper">{v.title}</p>
              <p className="font-body text-xs text-slate-400 mt-1">
                {v.chapter && `${v.chapter} · `}
                {v.teacherName} · {new Date(v.uploadTimestamp).toLocaleDateString("en-IN")}
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {v.tracks.map((t) => (
                  <span key={t.language} className="text-[11px] font-mono text-teal bg-night rounded-full px-2 py-0.5">
                    {LANGUAGE_LABELS[t.language] || t.language}
                  </span>
                ))}
              </div>
            </button>
          ))}
          {videos.length === 0 && (
            <p className="font-body text-sm text-slate-500 py-6 text-center">
              No lectures match these filters yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
