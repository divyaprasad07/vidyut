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
} from "./services/analytics.js";
import { checkTtsAvailability, synthesizeSpeech, SUPPORTED_TTS_LANGUAGES } from "./services/ttsService.js";
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

app.get("/api/students/:id", async (req, res) => {
  const student = await getDoc("students", req.params.id);
  if (!student) return res.status(404).json({ error: "not found" });
  const attempts = await getStudentQuizHistory(req.params.id);
  const streak = computeStreak(attempts.map((a) => a.timestamp));
  res.json({ ...student, streak });
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
  });

  const newRatings = { ...student.ratings, [topicId]: { rating, history } };
  await updateDoc("students", studentId, {
    ratings: newRatings,
    lastActive: new Date().toISOString(),
  });

  res.json({ attemptId, score, totalQuestions: answers.length, newRating: rating, review });
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
  res.json(students.map((s) => ({ id: s.id, name: s.name, class: s.class, ratings: s.ratings })));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`vidyut server listening on :${PORT} (db mode: ${dbMode})`);
});
