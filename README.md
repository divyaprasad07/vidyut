# ⚡ Vidyut

**An adaptive, gamified, multi-language learning platform for ICSE / CBSE students**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-visit-1D9E75)](#-live-deployment)
[![Demo Video](https://img.shields.io/badge/Demo-Watch%20Video-D85A30)](#-demo-video)
[![Made for Hackathon](https://img.shields.io/badge/Built%20for-Hackathon-534AB7)](#)

<!-- Optional: replace with your team/track name -->
Built by Team **[team name]** for **[hackathon name]**

</div>

---

## 🔗 Quick Links

| Live Deployment | Demo Video | Architecture |
|---|---|---|
| <!-- ADD DEPLOYED APP LINK HERE, e.g. https://vidyut.vercel.app --> | <!-- ADD DEMO VIDEO LINK HERE (YouTube/Drive) --> | [View diagram](#-architecture) |

---

## 📖 About the project

Vidyut is a full-stack learning platform that adapts to each student's level in real time, keeps them motivated with game mechanics (streaks, badges, a daily dice challenge), and works in the students' own language — including voice input/output in English, Hindi, Bengali, Marathi, Tamil, and Telugu. It also gives teachers a live dashboard to spot who's falling behind before it becomes a problem.

Built for classrooms where students are at very different levels, don't always have reliable connectivity, and are more comfortable in a regional language than in English.

### Problem statement
<!-- 1-2 lines: the specific problem your hackathon track asked you to solve -->

### Our solution
<!-- 2-3 lines summarizing your approach, if you want more than the About section above -->

---

## ✨ Key features

- **Adaptive quizzes** — an Elo-rating engine picks each next question based on the student's current skill, per topic (`server/services/eloEngine.js`)
- **7 subjects, 210 questions** — Mathematics, Science, English, Social Science, Hindi, Bengali, Tamil (with genuine, script-native language content, not translated)
- **Gamification** — Bronze → Diamond mastery badges, a daily dice-roll streak challenge, and permanent Platinum badges for perfect MCQ runs
- **Vernacular voice interaction** — read-aloud questions and mic-based answers in 6 languages, with a hybrid TTS pipeline (browser voices first, `espeak-ng` fallback so no language ever silently falls back to English)
- **AI study helper** — a scoped doubt-solving chatbot (Groq API) that only answers academic questions and redirects anything else to a trusted adult
- **Offline-first quiz taking** — answers queue in IndexedDB when the connection drops and sync automatically when it's back, with a visible "answers queued" indicator
- **Quiz integrity** — tab-switch/minimize detection with a two-warning grace period before an auto-submit, flagged clearly to teachers
- **Teacher dashboard** — class-wide proficiency trends, a subject-progress heatmap, per-student quiz history, and "at risk" / declining-activity flags
- **Video lecture library** — multi-language lecture uploads with subtitle tracks, filterable by subject and language
- **PWA** — installable, with an offline app-shell via service worker

---

## 🖼️ Screenshots

<!-- Add your screenshots below. Suggested: student home, quiz screen, teacher dashboard, profile, video library -->

### Frontend

| Student Home | Teacher Dashboard | Student Profile |
|---|---|---|
| <img width="1906" height="900" alt="Image" src="https://github.com/user-attachments/assets/b3b52bde-8b13-434c-b790-8d5785a0ac5b" />
<img width="1917" height="912" alt="Image" src="https://github.com/user-attachments/assets/90e092fa-5a12-4ac6-adf7-3758df65a5bc" />
<img width="1900" height="917" alt="Image" src="https://github.com/user-attachments/assets/f311f7ee-82d2-43e3-b395-28b5f31b5bc7" />
<img width="1913" height="912" alt="Image" src="https://github.com/user-attachments/assets/f0422751-0cd4-44d8-a855-c2647354cbc3" />
<img width="1856" height="882" alt="Image" src="https://github.com/user-attachments/assets/c8ef5843-cf29-4924-a7bc-514b8e86409c" />
<img width="1882" height="912" alt="Image" src="https://github.com/user-attachments/assets/28b96f19-9644-4617-97dc-d1f224398a80" />
<img width="1917" height="1078" alt="Image" src="https://github.com/user-attachments/assets/898ccf2e-aab6-41df-9847-1b13f7764a94" />
<img width="1917" height="1077" alt="Image" src="https://github.com/user-attachments/assets/4d36d473-a079-4c6f-999c-c00d92363990" />
<img width="1917" height="1077" alt="Image" src="https://github.com/user-attachments/assets/dedc2390-3beb-4c65-9251-78e2f31a1633" />
<img width="1917" height="1078" alt="Image" src="https://github.com/user-attachments/assets/75cb7cdd-fa14-4cf6-ac33-0186fc81bf93" />
<img width="1907" height="911" alt="Image" src="https://github.com/user-attachments/assets/664b7f5d-b7b1-4014-a18c-538792da9b53" />
<img width="430" height="591" alt="Image" src="https://github.com/user-attachments/assets/5acf0f39-536f-4e95-aa92-b52f01bee6b4" />
<img width="1917" height="1078" alt="Image" src="https://github.com/user-attachments/assets/c005a305-f19a-441b-af85-8ea5f126edc0" />
<img width="1228" height="1078" alt="Image" src="https://github.com/user-attachments/assets/1f2fb303-1a66-460b-af6b-eac1014177a8" />
<img width="1917" height="1078" alt="Image" src="https://github.com/user-attachments/assets/9a0a315c-26bc-4d14-a08f-1fe74d7c3722" />
<img width="1917" height="1078" alt="Image" src="https://github.com/user-attachments/assets/e515865e-a946-42ed-8f49-d9b3a30a2d62" />
<img width="1917" height="1078" alt="Image" src="https://github.com/user-attachments/assets/6f777df0-431e-4fbd-9612-8baf445f38ec" /> |

### Mobile responsive

| Home | Quiz | Profile |
|---|---|---|
| <!-- mobile screenshot --> | <!-- mobile screenshot --> | <!-- mobile screenshot --> |

---

## 🏗️ Architecture

![Vidyut architecture diagram](docs/vidyut-architecture.png)

<!-- The diagram above is generated as vidyut-architecture.png — place it in a docs/ folder in the repo root so this link resolves. -->

**Layers, top to bottom:**
1. **Client** — React + Vite PWA (student and teacher screens, offline queue via IndexedDB + service worker)
2. **API** — Express REST API grouped by domain (quiz/Elo, gamification, video, teacher analytics, chat/voice)
3. **Services** — the core business logic (`server/services/*.js`): Elo engine, badge engine, streak engine, dice service, analytics, chat, TTS, translation
4. **Data** — a swappable store: local JSON by default, or Firebase Firestore by setting `USE_FIREBASE=true` and dropping in a service account key — no other code changes needed
5. **External integrations** — all free-tier, no paid keys required: Groq (AI chat), MyMemory (translation), `espeak-ng` (TTS fallback), and the browser's own Web Speech API (STT + native TTS)

---

## 🧰 Tech stack

**Frontend:** React 18, Vite, React Router, Tailwind CSS, Recharts, `idb` (IndexedDB), `vite-plugin-pwa`
**Backend:** Node.js, Express, Multer (file uploads), CORS
**Data:** Local JSON store (default) or Firebase Firestore (`firebase-admin`)
**Voice/AI:** Groq API (chat), `espeak-ng` (TTS), MyMemory API (translation), Web Speech API (browser STT/TTS)

---

## 📂 Project structure

```
vidyut/
├── client/                      # React + Vite PWA
│   └── src/
│       ├── pages/                # StudentHome, Quiz, Profile, VideoLibrary, TeacherDashboard, ...
│       ├── dashboard/             # Teacher analytics widgets (charts, heatmap, tables)
│       ├── gamification/          # Dice3D, Leaderboard, Stone (badges), StreakFlame
│       ├── services/              # api client, offline queue, language providers
│       └── hooks/                 # useOfflineQueue, useQuizIntegrity
└── server/                      # Express API
    ├── index.js                  # routes
    ├── services/                  # eloEngine, badgeEngine, streakEngine, diceService,
    │                               # analytics, chatService, ttsService, translateService, db
    ├── scripts/                   # seedData.js, testElo.js
    └── data/                      # local JSON store (generated by npm run seed)
```

---

## 🚀 Getting started

### 1. Server

```bash
cd server
npm install
npm run seed      # generates demo students, topics, and 210 questions
npm start          # runs on :4000
```

Check it's running: `curl localhost:4000/api/health` → `{"ok":true,"dbMode":"local-json"}`
Teacher demo login PIN: `1234`

Optional `.env` in `server/` for the AI study helper:
```
GROQ_API_KEY=your_key_here
```

### 2. Client

```bash
cd client
npm install
npm run dev         # runs on :5173, proxies /api to :4000
```

Open `http://localhost:5173`. Teacher dashboard: `http://localhost:5173/teacher/login` (PIN `1234`).

### 3. Switching to Firebase (optional)

Drop a service account key at `server/serviceAccount.json`, then:
```bash
USE_FIREBASE=true npm start
```

---

## 🎥 Demo video

<!-- ADD DEMO VIDEO LINK HERE -->

## 🌐 Live deployment

<!-- ADD DEPLOYED APP LINK HERE -->

---

## ⚠️ Known limitations

- Single hardcoded demo student; no real Firebase Auth login screen yet
- Voice output needs `espeak-ng` installed locally for the server-side fallback path
- MCQ distractors are auto-generated, not hand-curated
- AI study helper's "academic questions only" scope is a prompt-level instruction, not a hard technical restriction

---

## 📄 License

MIT License

