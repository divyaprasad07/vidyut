// services/api.js
const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  health: () => request("/health"),
  topics: () => request("/topics"),
  student: (id) => request(`/students/${id}`),
  studentLogin: (email) =>
    request("/students/login", { method: "POST", body: JSON.stringify({ email }) }),
  badges: (id) => request(`/students/${id}/badges`),
  nextQuestion: (studentId, topic, excludeIds = [], rating = null) => {
    const params = new URLSearchParams({ studentId, topic });
    if (excludeIds.length) params.set("excludeIds", excludeIds.join(","));
    if (rating != null) params.set("rating", rating);
    return request(`/questions/next?${params.toString()}`);
  },
  checkAnswer: (payload) =>
    request("/questions/check", { method: "POST", body: JSON.stringify(payload) }),
  submitAttempt: (payload) =>
    request("/attempts", { method: "POST", body: JSON.stringify(payload) }),
  teacherLogin: (pin) =>
    request("/teacher/login", { method: "POST", body: JSON.stringify({ pin }) }),
  declining: (windowDays = 7) => request(`/teacher/declining?windowDays=${windowDays}`),
  weakInTopic: (topic, threshold = 1050) =>
    request(`/teacher/weak?topic=${topic}&threshold=${threshold}`),
  leaderboard: () => request("/teacher/leaderboard"),
  studentHistory: (id) => request(`/teacher/history/${id}`),
  allStudents: () => request("/teacher/students"),
  videos: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/videos?${params.toString()}`);
  },
  videoLanguages: () => request("/videos/languages"),
  uploadVideo: async (formData) => {
    const res = await fetch(`${BASE}/videos/upload`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
  addVideoTrack: async (videoId, formData) => {
    const res = await fetch(`${BASE}/videos/${videoId}/tracks`, { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Add track failed: ${res.status}`);
    }
    return res.json();
  },
  updateVideo: (videoId, patch) =>
    request(`/videos/${videoId}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteVideo: (videoId) => request(`/videos/${videoId}`, { method: "DELETE" }),
  deleteVideoTrack: (videoId, language) =>
    request(`/videos/${videoId}/tracks/${language}`, { method: "DELETE" }),
  synthesizeSpeech: async (text, lang) => {
    const res = await fetch(`${BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `TTS failed: ${res.status}`);
    }
    return res.blob();
  },
  chat: async (message, history) => {
    const res = await fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Chat failed: ${res.status}`);
    }
    return res.json(); // { reply }
  },
  chatStatus: () => request("/chat/status"),
  translate: (text, targetLang, sourceLang = "en") =>
    request("/translate", { method: "POST", body: JSON.stringify({ text, targetLang, sourceLang }) }),
  diceStatus: (studentId) => request(`/dice/status?studentId=${studentId}`),
  diceRoll: (studentId) =>
    request("/dice/roll", { method: "POST", body: JSON.stringify({ studentId }) }),
  diceQuestions: (count, excludeIds = []) => {
    const params = new URLSearchParams({ count });
    if (excludeIds.length) params.set("exclude", excludeIds.join(","));
    return request(`/dice/questions?${params.toString()}`);
  },
  diceSubmit: (studentId, answers) =>
    request("/dice/submit", { method: "POST", body: JSON.stringify({ studentId, answers }) }),
};
