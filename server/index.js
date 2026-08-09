import "dotenv/config"; // loads server/.env into process.env (e.g. GROQ_API_KEY), must be first
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCollection, getDoc, setDoc, addDoc, updateDoc, deleteDoc, dbMode } from "./services/db.js";
import { pickNextQuestion, updateRating, startingRating } from "./services/eloEngine.js";
import { earnedTiers, tierMeta, TIERS, masteryPercent } from "./services/badgeEngine.js";
import { computeStreak } from "./services/streakEngine.js";
import {
  getDecliningActivity,
  getWeakInTopic,
  getTeacherRatingLeaderboard,
  getStudentQuizHistory,
  getPlatinumBadgeCount,
} from "./services/analytics.js";
import { checkTtsAvailability, synthesizeSpeech, SUPPORTED_TTS_LANGUAGES } from "./services/ttsService.js";
import {
  rollForToday,
  getTodayChallenge,
  pickRandomQuestions,
  submitChallenge,
  getStreakDates,
} from "./services/diceService.js";
import { getChatReply, chatConfigured } from "./services/chatService.js";
import { translateText } from "./services/translateService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB, plenty for a hackathon demo clip
});

const TOPICS = [
  { id: "math", name: "Mathematics" },
  { id: "science", name: "Science" },
  { id: "english", name: "English" },
  { id: "social_science", name: "Social Science" },
  { id: "hindi", name: "Hindi" },
  { id: "bengali", name: "Bengali" },
  { id: "tamil", name: "Tamil" },
];

app.get("/api/health", (req, res) => res.json({ ok: true, dbMode }));

// ---- AI doubt-solving chat (academic help only, see chatService.js) ----

app.get("/api/chat/status", (req, res) => res.json({ available: chatConfigured() }));

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  try {
    const reply = await getChatReply(message, history);
    res.json({ reply });
  } catch (err) {
    console.warn("Chat request failed:", err.message);
    const status = err.message?.includes("not configured") ? 503 : 400;
    res.status(status).json({ error: err.message });
  }
});

// Translates text between languages, used so a chat reply (always in
// English) can be read aloud in the student's chosen language.
app.post("/api/translate", async (req, res) => {
  const { text, targetLang, sourceLang } = req.body;
  try {
    const translatedText = await translateText(text, targetLang, sourceLang || "en");
    res.json({ translatedText });
  } catch (err) {
    console.warn("Translation failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/topics", (req, res) => res.json(TOPICS));

// ---- Text-to-speech (Tier 2 vernacular voice) ----

app.get("/api/tts/status", async (req, res) => {
  res.json({ available: await checkTtsAvailability(), languages: SUPPORTED_TTS_LANGUAGES });
});

app.post("/api/tts", async (req, res) => {
  const { text, lang } = req.body;
  try {
    const audioBuffer = await synthesizeSpeech(text, lang);
    res.set("Content-Type", "audio/wav");
    res.send(audioBuffer);
  } catch (err) {
    console.warn("TTS synthesis failed:", err.message);
    res.status(err.message?.includes("unsupported") || err.message?.includes("no text") || err.message?.includes("too long") ? 400 : 503)
      .json({ error: err.message });
  }
});

// ---- Student ----

// Looks a student up by email so the landing page can log a student in
// without a password (matches the "demo student list" auth level of the
// existing teacher PIN login, not real Firebase Auth, see App.jsx note).
app.post("/api/students/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  const students = await getCollection("students");
  const match = students.find(
    (s) => (s.email || "").toLowerCase() === String(email).trim().toLowerCase()
  );
  if (!match) return res.status(404).json({ error: "No student found with that email." });
  res.json({ studentId: match.id, name: match.name });
});

const VALID_CLASSES = ["6A", "6B", "7A", "7B", "8A", "8B"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Real signup, not limited to the 20 seeded demo accounts: a genuinely
// new name/email/class creates a brand-new student record (default
// rating 1000 on every topic, 0 streak, no history), same shape as any
// seeded student. If the email already exists, this logs that existing
// student in instead of erroring, so accidentally submitting the signup
// form twice doesn't create a duplicate account or a confusing error.
app.post("/api/students/signup", async (req, res) => {
  const { name, email, class: klass } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });
  if (!email || !EMAIL_PATTERN.test(String(email).trim())) {
    return res.status(400).json({ error: "a valid email is required" });
  }
  if (!VALID_CLASSES.includes(klass)) {
    return res.status(400).json({ error: "please select a valid class" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const students = await getCollection("students");
  const existing = students.find((s) => (s.email || "").toLowerCase() === normalizedEmail);
  if (existing) {
    return res.json({ studentId: existing.id, name: existing.name, alreadyExisted: true });
  }

  const id = await addDoc("students", {
    name: name.trim(),
    email: normalizedEmail,
    class: klass,
    school: "",
    language: "en",
    ratings: {},
    lastActive: null,
  });
  res.json({ studentId: id, name: name.trim(), alreadyExisted: false });
});

app.get("/api/students/:id", async (req, res) => {
  const student = await getDoc("students", req.params.id);
  if (!student) return res.status(404).json({ error: "not found" });
  // Streak now comes ONLY from passed daily dice challenges, not from
  // regular topic quizzes, that decoupling is the whole point of the
  // dice feature: quizzes build your leaderboard rating, the dice
  // challenge is what keeps your streak alive, deliberately two
  // different things now.
  const streakDates = await getStreakDates(req.params.id);
  const streak = computeStreak(streakDates);
  const platinumBadges = await getPlatinumBadgeCount(req.params.id);
  res.json({ ...student, streak, platinumBadges });
});

// Real per-day time-spent-learning for the last 7 days, used for the
// student home "Learning Momentum" chart. Computed from actual quiz
// attempt timestamps and timeTakenSec, nothing fabricated here. Dice
// challenge attempts don't currently record time-taken, so they're not
// included, this only reflects regular topic quizzes for now.
app.get("/api/students/:id/momentum", async (req, res) => {
  const quizAttempts = await getStudentQuizHistory(req.params.id);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const minutesByDay = Object.fromEntries(days.map((d) => [d, 0]));
  for (const a of quizAttempts) {
    const day = new Date(a.timestamp).toISOString().slice(0, 10);
    if (day in minutesByDay) minutesByDay[day] += (a.timeTakenSec || 0) / 60;
  }

  res.json(days.map((d) => ({ day: d, minutes: Math.round(minutesByDay[d]) })));
});

app.get("/api/students/:id/badges", async (req, res) => {
  const student = await getDoc("students", req.params.id);
  if (!student) return res.status(404).json({ error: "not found" });
  const attempts = await getStudentQuizHistory(req.params.id);

  const badges = TOPICS.map((topic) => {
    const rating = student.ratings?.[topic.id]?.rating ?? startingRating();
    const topicAttempts = attempts.filter((a) => a.topicId === topic.id);
    const tiers = earnedTiers(rating, topicAttempts);
    return {
      topic: topic.id,
      topicName: topic.name,
      rating,
      masteryPercent: masteryPercent(rating),
      tiers: tiers.map((t) => tierMeta(t)),
    };
  });

  res.json({ allTiers: TIERS, badges });
});

// Next adaptive question for a student in a topic.
// Accepts optional excludeIds (csv of question ids already shown this
// in-progress quiz session) and rating (the session's provisional rating,
// tracked client-side via /api/questions/check as the quiz progresses) so
// the engine adapts within a single quiz, not just between quizzes. The
// persisted attempt + rating are still only written once, at quiz end via
// POST /api/attempts, exactly as before.
app.get("/api/questions/next", async (req, res) => {
  const { studentId, topic, excludeIds, rating } = req.query;
  const student = await getDoc("students", studentId);
  if (!student) return res.status(404).json({ error: "student not found" });

  const attempts = await getStudentQuizHistory(studentId);
  const persistedAnswered = attempts
    .filter((a) => a.topicId === topic)
    .flatMap((a) => a.questionIds);
  const sessionExcluded = excludeIds ? excludeIds.split(",").filter(Boolean) : [];
  const answeredQIds = new Set([...persistedAnswered, ...sessionExcluded]);

  const allQuestions = await getCollection("questions");
  const available = allQuestions.filter(
    (q) => q.topic === topic && !answeredQIds.has(q.id)
  );

  const effectiveRating = rating
    ? Number(rating)
    : student.ratings?.[topic]?.rating ?? startingRating();
  const next = pickNextQuestion(effectiveRating, available);
  if (!next) return res.json({ done: true, message: "No more questions in this topic." });
  // never send the answer to the client
  const { correctAnswer, ...safeQuestion } = next;
  res.json({ done: false, question: safeQuestion, currentRating: effectiveRating });
});

// Score a single answer without persisting anything. Used mid-quiz so the
// client can carry a provisional rating/exclude-list into the next
// GET /api/questions/next call, making the engine adapt within one quiz.
// The real attempt + rating write still only happens once, at quiz end,
// via POST /api/attempts below, recomputed from the full answer sequence,
// so nothing here is double-counted.
app.post("/api/questions/check", async (req, res) => {
  const { questionId, submittedAnswer, currentRating } = req.body;
  const allQuestions = await getCollection("questions");
  const q = allQuestions.find((x) => x.id === questionId);
  if (!q) return res.status(404).json({ error: "question not found" });

  const correct =
    q.correctAnswer.trim().toLowerCase() ===
    String(submittedAnswer || "").trim().toLowerCase();
  const newRating = updateRating(Number(currentRating), q.difficultyRating, correct);
  res.json({ correct, newRating });
});

// Submit a batch of answers for one quiz attempt (also the offline-sync target)
app.post("/api/attempts", async (req, res) => {
  const {
    studentId,
    topicId,
    answers, // [{questionId, submittedAnswer, timeTakenSec}]
    autoSubmitted = false,
    violationType = null,
    quizMode = null, // "mcq" | "short" | "mixed", used for the Platinum badge below
  } = req.body;

  const student = await getDoc("students", studentId);
  if (!student) return res.status(404).json({ error: "student not found" });

  const allQuestions = await getCollection("questions");
  let rating = student.ratings?.[topicId]?.rating ?? startingRating();
  let score = 0;
  const history = student.ratings?.[topicId]?.history ?? [];
  const review = [];

  for (const ans of answers) {
    const q = allQuestions.find((x) => x.id === ans.questionId);
    if (!q) continue;
    const correct =
      q.correctAnswer.trim().toLowerCase() ===
      String(ans.submittedAnswer || "").trim().toLowerCase();
    if (correct) score++;
    rating = updateRating(rating, q.difficultyRating, correct);
    history.push({ rating, ts: new Date().toISOString() });
    review.push({
      questionId: q.id,
      questionText: q.text,
      submittedAnswer: ans.submittedAnswer,
      correctAnswer: q.correctAnswer,
      correct,
    });
  }

  const totalTime = answers.reduce((s, a) => s + (a.timeTakenSec || 0), 0);

  const attemptId = await addDoc("attempts", {
    studentId,
    topicId,
    questionIds: answers.map((a) => a.questionId),
    score,
    questionsAttempted: answers.length,
    timeTakenSec: totalTime,
    timestamp: new Date().toISOString(),
    autoSubmitted,
    violationType,
    quizMode,
  });

  const newRatings = { ...student.ratings, [topicId]: { rating, history } };
  await updateDoc("students", studentId, {
    ratings: newRatings,
    lastActive: new Date().toISOString(),
  });

  // Same criteria as getPlatinumBadgeCount (analytics.js): perfect score,
  // 8+ questions, Multiple Choice mode specifically. Told to the client
  // here so the results screen can show the congratulatory moment right
  // when it happens, not just reflect the count silently later.
  const platinumEarned = quizMode === "mcq" && answers.length >= 8 && score === answers.length;

  res.json({ attemptId, score, totalQuestions: answers.length, newRating: rating, review, platinumEarned });
});

// ---- Daily dice streak challenge ----
//
// Entirely separate from the quiz/attempts system above: this never
// touches a student's rating or the leaderboard, on purpose. See
// services/diceService.js for the full design rationale.

app.get("/api/dice/status", async (req, res) => {
  const { studentId } = req.query;
  const challenge = await getTodayChallenge(studentId);
  res.json({ challenge });
});

app.post("/api/dice/roll", async (req, res) => {
  const { studentId } = req.body;
  const student = await getDoc("students", studentId);
  if (!student) return res.status(404).json({ error: "student not found" });
  const challenge = await rollForToday(studentId);
  res.json({ challenge });
});

app.get("/api/dice/questions", async (req, res) => {
  const count = Number(req.query.count) || 1;
  const excludeIds = req.query.exclude ? req.query.exclude.split(",").filter(Boolean) : [];
  const questions = await pickRandomQuestions(count, excludeIds);
  // Never send the correct answer to the client, same rule as the main quiz.
  const safeQuestions = questions.map(({ correctAnswer, ...rest }) => rest);
  res.json({ questions: safeQuestions });
});

app.post("/api/dice/submit", async (req, res) => {
  const { studentId, answers } = req.body;
  try {
    const result = await submitChallenge(studentId, answers);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- Video lectures (Tier 2) ----
//
// Schema: one lecture doc can have multiple language "tracks", each its
// own uploaded file. A teacher uploads in whichever language they're
// comfortable teaching in (that becomes the first track); anyone can add
// further tracks in other languages later via the "add language" flow.
// A student then picks which track's audio they want to watch in,
// independent of which language the teacher originally recorded.

const SUPPORTED_LANGUAGES = ["en", "hi", "bn", "mr", "ta", "te"];

// Student-side browse: filter by class, subject (topic), and/or language
// (matches if ANY track on the lecture is in that language).
app.get("/api/videos", async (req, res) => {
  const { class: klass, subject, language } = req.query;
  let videos = await getCollection("videos");
  if (klass) videos = videos.filter((v) => v.class === klass);
  if (subject) videos = videos.filter((v) => v.subject === subject);
  if (language) videos = videos.filter((v) => (v.tracks || []).some((t) => t.language === language));
  videos.sort((a, b) => new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp));
  res.json(videos);
});

app.get("/api/videos/languages", (req, res) => res.json(SUPPORTED_LANGUAGES));

// Creates a new lecture with its first track, in the teacher's own
// language of comfort. Videos persist to disk (server/uploads) and the
// library reflects the new entry immediately, no separate publish step.
app.post("/api/videos/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file uploaded" });
  const { title, subject, class: klass, chapter, language, teacherName, captionsUrl } = req.body;
  if (!title || !subject || !klass) {
    fs.unlink(req.file.path, () => {}); // don't leave an orphaned upload behind
    return res.status(400).json({ error: "title, subject, and class are required" });
  }

  const id = await addDoc("videos", {
    title,
    subject,
    class: klass,
    chapter: chapter || "",
    teacherName: teacherName || "Uploaded by teacher",
    uploadTimestamp: new Date().toISOString(),
    tracks: [
      {
        language: SUPPORTED_LANGUAGES.includes(language) ? language : "en",
        storageUrl: `/uploads/${req.file.filename}`,
        captionsUrl: captionsUrl || "",
        uploadTimestamp: new Date().toISOString(),
      },
    ],
  });

  res.json({ id, storageUrl: `/uploads/${req.file.filename}` });
});

// Adds an additional language track to an existing lecture, so students
// can later choose that language's audio for the same lecture content.
// Rejects a duplicate language on the same lecture rather than silently
// overwriting a track someone might still be relying on.
app.post("/api/videos/:id/tracks", upload.single("file"), async (req, res) => {
  const video = await getDoc("videos", req.params.id);
  if (!video) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: "lecture not found" });
  }
  if (!req.file) return res.status(400).json({ error: "no file uploaded" });
  const { language, captionsUrl } = req.body;
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "unsupported language" });
  }
  if ((video.tracks || []).some((t) => t.language === language)) {
    fs.unlink(req.file.path, () => {});
    return res.status(409).json({ error: `this lecture already has a ${language} track, delete it first to replace it` });
  }

  const newTrack = {
    language,
    storageUrl: `/uploads/${req.file.filename}`,
    captionsUrl: captionsUrl || "",
    uploadTimestamp: new Date().toISOString(),
  };
  const updated = await updateDoc("videos", req.params.id, {
    tracks: [...(video.tracks || []), newTrack],
  });
  res.json(updated);
});

// Edit metadata (title/subject/class/chapter). Does not touch tracks,
// deliberately, so this can't be used to sneak in a file change.
app.patch("/api/videos/:id", async (req, res) => {
  const video = await getDoc("videos", req.params.id);
  if (!video) return res.status(404).json({ error: "lecture not found" });
  const { title, subject, class: klass, chapter } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title;
  if (subject !== undefined) patch.subject = subject;
  if (klass !== undefined) patch.class = klass;
  if (chapter !== undefined) patch.chapter = chapter;
  const updated = await updateDoc("videos", req.params.id, patch);
  res.json(updated);
});

// Deletes a lecture and every track's underlying file on disk, not just
// the database entry, so a bad upload doesn't leave orphaned video files
// behind.
app.delete("/api/videos/:id", async (req, res) => {
  const video = await getDoc("videos", req.params.id);
  if (!video) return res.status(404).json({ error: "lecture not found" });
  for (const track of video.tracks || []) {
    const filePath = path.join(UPLOADS_DIR, path.basename(track.storageUrl));
    fs.unlink(filePath, () => {}); // best-effort, don't fail the delete if a file's already gone
    if (track.captionsUrl) {
      const captionsPath = path.join(UPLOADS_DIR, path.basename(track.captionsUrl));
      fs.unlink(captionsPath, () => {});
    }
  }
  await deleteDoc("videos", req.params.id);
  res.json({ deleted: true, id: req.params.id });
});

// Deletes a single language track from a lecture, keeping the rest.
app.delete("/api/videos/:id/tracks/:language", async (req, res) => {
  const video = await getDoc("videos", req.params.id);
  if (!video) return res.status(404).json({ error: "lecture not found" });
  const track = (video.tracks || []).find((t) => t.language === req.params.language);
  if (!track) return res.status(404).json({ error: "track not found" });

  const filePath = path.join(UPLOADS_DIR, path.basename(track.storageUrl));
  fs.unlink(filePath, () => {});
  if (track.captionsUrl) {
    fs.unlink(path.join(UPLOADS_DIR, path.basename(track.captionsUrl)), () => {});
  }

  const remainingTracks = (video.tracks || []).filter((t) => t.language !== req.params.language);
  if (remainingTracks.length === 0) {
    // No tracks left at all, the lecture entry itself is meaningless now.
    await deleteDoc("videos", req.params.id);
    return res.json({ deleted: true, lectureDeleted: true, id: req.params.id });
  }
  const updated = await updateDoc("videos", req.params.id, { tracks: remainingTracks });
  res.json({ deleted: true, lectureDeleted: false, video: updated });
});

// ---- Teacher dashboard ----

app.post("/api/teacher/login", async (req, res) => {
  const { teacherId = "teacher_1", pin } = req.body;
  const teacher = await getDoc("teachers", teacherId);
  if (!teacher || teacher.pinHash !== pin) {
    return res.status(401).json({ error: "invalid PIN" });
  }
  res.json({ ok: true, teacher: { id: teacher.id, name: teacher.name, classesTaught: teacher.classesTaught } });
});

app.get("/api/teacher/declining", async (req, res) => {
  const windowDays = Number(req.query.windowDays) || 7;
  res.json(await getDecliningActivity(windowDays));
});

app.get("/api/teacher/weak", async (req, res) => {
  const { topic, threshold } = req.query;
  res.json(await getWeakInTopic(topic, Number(threshold) || 1000));
});

app.get("/api/teacher/leaderboard", async (req, res) => {
  res.json(await getTeacherRatingLeaderboard());
});

app.get("/api/teacher/history/:studentId", async (req, res) => {
  res.json(await getStudentQuizHistory(req.params.studentId));
});

app.get("/api/teacher/students", async (req, res) => {
  const students = await getCollection("students");
  const withBadges = await Promise.all(
    students.map(async (s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      ratings: s.ratings,
      platinumBadges: await getPlatinumBadgeCount(s.id),
    }))
  );
  res.json(withBadges);
});

// Real, computed class-wide metrics for the teacher dashboard header
// (average mastery, students active today, questions solved in the last
// 7 days, and a decline-based risk label). Optionally scoped to one
// class via ?class=. Every number here is derived from actual student
// ratings and attempt timestamps, none of it is a placeholder.
app.get("/api/teacher/overview", async (req, res) => {
  const { class: klass } = req.query;
  const allStudents = await getCollection("students");
  const students = klass ? allStudents.filter((s) => s.class === klass) : allStudents;
  const studentIds = new Set(students.map((s) => s.id));

  const allAttempts = await getCollection("attempts");
  const attempts = allAttempts.filter((a) => studentIds.has(a.studentId));

  const masteryValues = students.flatMap((s) =>
    Object.values(s.ratings || {}).map((r) => masteryPercent(r.rating))
  );
  const avgMastery = masteryValues.length
    ? Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length)
    : 0;

  const todayKey = new Date().toISOString().slice(0, 10);
  const activeToday = new Set(
    attempts
      .filter((a) => new Date(a.timestamp).toISOString().slice(0, 10) === todayKey)
      .map((a) => a.studentId)
  ).size;

  const weekAgo = Date.now() - 7 * 86400000;
  const questionsSolvedThisWeek = attempts
    .filter((a) => new Date(a.timestamp).getTime() >= weekAgo)
    .reduce((sum, a) => sum + (a.questionsAttempted || 0), 0);

  const declining = await getDecliningActivity(7);
  const decliningInScope = klass
    ? declining.filter((d) => studentIds.has(d.studentId))
    : declining;
  const riskLevel =
    decliningInScope.length === 0 ? "LOW" : decliningInScope.length <= 2 ? "MEDIUM" : "HIGH";

  res.json({
    totalStudents: students.length,
    avgMastery,
    activeToday,
    questionsSolvedThisWeek,
    decliningCount: decliningInScope.length,
    riskLevel,
  });
});

// --- Serve the built React frontend (production only) ---
// In dev, Vite serves the client on :5173 and proxies /api to this server.
// In production there is no Vite dev server, so this Express server serves
// the built client/dist folder directly. That means ONE server, ONE URL:
// visiting the site loads the app, and /api/* still hits the routes above.
const CLIENT_DIST = path.join(__dirname, "../client/dist");
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // Any request that isn't an API/uploads route and isn't a real static
  // file falls through to index.html, so client-side routing (react-router)
  // works on refresh/direct links like /videos or /teacher/login.
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`vidyut server listening on :${PORT} (db mode: ${dbMode})`);
});
