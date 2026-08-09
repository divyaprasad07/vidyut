// dashboard/VideoUpload.jsx
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

export function VideoUpload({ topics, classes, teacherName, onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(topics[0]?.id || "");
  const [klass, setKlass] = useState(classes[0] || "");
  const [chapter, setChapter] = useState("");
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error

  const submit = async (e) => {
    e.preventDefault();
    if (!file || !title || !subject || !klass) return;
    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("class", klass);
    formData.append("chapter", chapter);
    formData.append("language", language);
    formData.append("teacherName", teacherName);
    try {
      await api.uploadVideo(formData);
      setStatus("done");
      setTitle("");
      setChapter("");
      setFile(null);
      e.target.reset();
      onUploaded?.();
    } catch (err) {
      console.error("Video upload failed:", err);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          placeholder="Lecture title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border border-slate-300 rounded-md px-3 py-2 text-sm font-body md:col-span-2"
        />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm font-body"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={klass}
          onChange={(e) => setKlass(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm font-body"
        >
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Chapter (optional)"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm font-body"
        />
        <div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm font-body w-full"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p className="font-body text-[11px] text-slate-400 mt-1">
            The language you're recording in. Add more languages for this same lecture afterward
            from the library below, students can then pick whichever they want to watch in.
          </p>
        </div>
      </div>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0] || null)}
        required
        className="text-sm font-body mb-3 block"
      />
      <button
        type="submit"
        disabled={status === "uploading"}
        className="bg-ink text-paper font-body font-semibold text-sm px-5 py-2.5 rounded-lg disabled:opacity-50"
      >
        {status === "uploading" ? "Uploading..." : "Upload lecture"}
      </button>
      {status === "done" && <p className="font-body text-sm text-teal-700 mt-2">Uploaded, it's live in the library now.</p>}
      {status === "error" && <p className="font-body text-sm text-red-600 mt-2">Upload failed, please try again.</p>}
    </form>
  );
}
