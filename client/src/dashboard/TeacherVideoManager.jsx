// dashboard/TeacherVideoManager.jsx
import { useState } from "react";
import { api } from "../services/api";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
];
const LANGUAGE_LABELS = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.label]));

function AddTrackForm({ videoId, existingLanguages, onAdded }) {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState(
    LANGUAGES.find((l) => !existingLanguages.includes(l.code))?.code || "en"
  );
  const [status, setStatus] = useState("idle");
  const available = LANGUAGES.filter((l) => !existingLanguages.includes(l.code));

  if (available.length === 0) {
    return <p className="font-body text-xs text-slate-400">All 6 languages are already uploaded for this lecture.</p>;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    try {
      await api.addVideoTrack(videoId, formData);
      setStatus("idle");
      setFile(null);
      e.target.reset();
      onAdded();
    } catch (err) {
      setStatus("error: " + err.message);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 flex-wrap mt-2">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="border border-slate-300 rounded-md px-2 py-1 text-xs font-body"
      >
        {available.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0] || null)}
        className="text-xs font-body"
      />
      <button
        type="submit"
        disabled={!file || status === "uploading"}
        className="bg-teal-700 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-md disabled:opacity-50"
      >
        {status === "uploading" ? "Adding..." : "Add language"}
      </button>
      {status.startsWith("error") && <span className="text-xs text-red-600 font-body">{status}</span>}
    </form>
  );
}

function LectureRow({ video, topics, classes, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [playLanguage, setPlayLanguage] = useState(video.tracks[0]?.language);
  const [form, setForm] = useState({
    title: video.title, subject: video.subject, class: video.class, chapter: video.chapter,
  });

  const activeTrack = video.tracks.find((t) => t.language === playLanguage) || video.tracks[0];

  const saveEdit = async () => {
    await api.updateVideo(video.id, form);
    setEditing(false);
    onChanged();
  };

  const deleteWholeLecture = async () => {
    if (!confirm(`Delete "${video.title}" entirely, including all ${video.tracks.length} language track(s)? This can't be undone.`)) return;
    await api.deleteVideo(video.id);
    onChanged();
  };

  const deleteTrack = async (language) => {
    if (!confirm(`Remove the ${LANGUAGE_LABELS[language]} track from "${video.title}"?`)) return;
    await api.deleteVideoTrack(video.id, language);
    onChanged();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      {editing ? (
        <div className="flex flex-col gap-2 mb-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body"
          />
          <div className="flex gap-2">
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body"
            >
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select
              value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body"
            >
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={form.chapter}
              onChange={(e) => setForm({ ...form, chapter: e.target.value })}
              placeholder="Chapter"
              className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body flex-1"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit} className="bg-ink text-paper text-xs font-body font-semibold px-3 py-1.5 rounded-md">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-xs font-body text-slate-500">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-body font-semibold text-ink text-sm">{video.title}</p>
            <p className="font-body text-xs text-slate-500 mt-0.5">
              {video.class} · {topics.find((t) => t.id === video.subject)?.name || video.subject}
              {video.chapter && ` · ${video.chapter}`} ·{" "}
              {new Date(video.uploadTimestamp).toLocaleDateString("en-IN")}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setExpanded(!expanded)} className="text-xs font-body text-teal-700 underline">
              {expanded ? "Hide" : "Manage"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {video.tracks.map((t) => (
          <span key={t.language} className="text-[11px] font-mono text-teal-800 bg-teal-50 rounded-full px-2 py-0.5">
            {LANGUAGE_LABELS[t.language] || t.language}
          </span>
        ))}
      </div>

      {expanded && !editing && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {activeTrack && (
            <div className="mb-3">
              <video key={`${video.id}-${activeTrack.language}`} controls className="w-full max-w-sm rounded-lg bg-black" src={activeTrack.storageUrl} />
              {video.tracks.length > 1 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {video.tracks.map((t) => (
                    <button
                      key={t.language}
                      onClick={() => setPlayLanguage(t.language)}
                      className={`text-xs font-body px-2 py-1 rounded-full ${
                        activeTrack.language === t.language ? "bg-ink text-paper" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {LANGUAGE_LABELS[t.language]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mb-3">
            <button onClick={() => setEditing(true)} className="text-xs font-body text-slate-600 underline">
              Edit details
            </button>
            <button onClick={deleteWholeLecture} className="text-xs font-body text-red-600 underline">
              Delete entire lecture
            </button>
          </div>

          <p className="font-body text-xs text-slate-500 mb-1">Remove a language track</p>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {video.tracks.map((t) => (
              <button
                key={t.language}
                onClick={() => deleteTrack(t.language)}
                className="text-xs font-body text-slate-500 bg-slate-100 rounded-full px-2 py-1 hover:bg-red-50 hover:text-red-600"
              >
                {LANGUAGE_LABELS[t.language]} ✕
              </button>
            ))}
          </div>

          <p className="font-body text-xs text-slate-500 mb-1">Add a language track</p>
          <AddTrackForm
            videoId={video.id}
            existingLanguages={video.tracks.map((t) => t.language)}
            onAdded={onChanged}
          />
        </div>
      )}
    </div>
  );
}

export function TeacherVideoManager({ videos, topics, classes, onChanged }) {
  if (videos.length === 0) {
    return <p className="font-body text-sm text-slate-400">No lectures uploaded yet.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {videos.map((v) => (
        <LectureRow key={v.id} video={v} topics={topics} classes={classes} onChanged={onChanged} />
      ))}
    </div>
  );
}
