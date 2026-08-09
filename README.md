<div align="center">

# ⚡ Vidyut

An adaptive, gamified, multi-language learning platform
    
[![Live Demo](https://img.shields.io/badge/Live%20Demo-visit-1D9E75)](http://vidyut-4xwl.onrender.com)
[![Demo Video](https://img.shields.io/badge/Demo-Watch%20Video-D85A30)](https://drive.google.com/file/d/1oa3odLcVLiyK9EwParw04zuG0tWPM96n/view?usp=sharing)

Built by Team **TRIPLE STACK** for **IEM HACKS 4.0**

</div>

---

## 🔗 Quick Links

| Live Deployment | Demo Video |
|---|---|
| https://vidyut-4xwl.onrender.com| https://drive.google.com/file/d/1oa3odLcVLiyK9EwParw04zuG0tWPM96n/view?usp=sharing |

---

## 📖 About the project

Vidyut is a full-stack learning platform that adapts to each student's level in real time, keeps them motivated with game mechanics (streaks, badges, a daily dice challenge), and works in the students' own (regional) language - including voice input/output in English, Hindi, Bengali, Marathi, Tamil, and Telugu. It also gives teachers a live dashboard to spot who's falling behind before it becomes a problem.

Built for classrooms where students are at very different levels, don't always have reliable connectivity, and are more comfortable in a regional language than in English.

### Problem statement
Students, especially in rural and semi-urban areas, lack personalized, multilingual, reliable learning support that adapts to their level and remains accessible even with limited connectivity.

(i)   Students learn at different speeds and strengths across subjects, but most platforms provide the same content and difficulty level to everyone.

(ii)  A student may be advanced in Mathematics but struggle in English; one fixed learning path cannot support both needs effectively.

(iii) For many rural and semi-urban students, language barriers and unreliable internet reduce access to digital learning resources.

(iv)  When students cannot get immediate help for doubts, small misunderstandings often become larger learning gaps.

(v)   Without regular feedback and progress tracking, students may lose motivation even when quality content is available.

### Our solution
Vidyut becomes the layer between a rural classroom and the same quality of personalized, multilingual, always-available academic support that a private tutor already provides - not by replacing the teacher, but by giving every student a system that actually adapts to them.

## ✨ Key features - Unique Selling Point

- **Adaptive quizzes** : an Elo-rating engine picks each next question based on the student's current skill, per topic (`server/services/eloEngine.js`)
- **7 subjects, 210 questions** : Mathematics, Science, English, Social Science, Hindi, Bengali, Tamil (with genuine, script-native language content, not translated)
- **Gamification** : Bronze → Diamond mastery badges, a daily dice-roll streak challenge, and permanent Platinum badges for perfect MCQ runs
- **Vernacular voice interaction** — read-aloud questions and mic-based answers in 6 languages, with a hybrid TTS pipeline (browser voices first, `espeak-ng` fallback so no language ever silently falls back to English)
- **AI study helper** : a scoped doubt-solving chatbot (Groq API) that only answers academic questions and redirects anything else to a trusted adult
- **Offline-first quiz taking** : answers queue in IndexedDB when the connection drops and sync automatically when it's back, with a visible "answers queued" indicator
- **Quiz integrity** : tab-switch/minimize detection with a two-warning grace period before an auto-submit, flagged clearly to teachers
- **Teacher dashboard** : class-wide proficiency trends, a subject-progress heatmap, per-student quiz history, and "at risk" / declining-activity flags
- **Video lecture library** : multi-language lecture uploads with subtitle tracks, filterable by subject and language, offline video downloadable option
- **PWA** : installable, with an offline app-shell via service worker

---

## 🖼️ Screenshots


### Frontend

| **USP** | **Screenshot** |
|---|---|
| Student Home | <img width="1500" height="700" alt="Screenshot 2026-08-10 002626" src="https://github.com/user-attachments/assets/68cc58a6-7f60-43ef-82c7-27eaaca2dc2f" /> |
| Teacher Dashboard | <img width="1500" height="700" alt="Screenshot 2026-08-10 003733" src="https://github.com/user-attachments/assets/330beac3-689e-4222-aa35-4a425355024d" /> |
| Student Profile | <img width="1500" height="700" alt="Screenshot 2026-08-10 003400" src="https://github.com/user-attachments/assets/859a4a8f-b3af-4dfd-bc28-208a27e76762" /> |
| Landing Page for Student and Teacher login | <img width="1500" height="700" alt="Screenshot 2026-08-10 002427" src="https://github.com/user-attachments/assets/7b4075d5-511a-49c8-bfe7-63d08a10e456" /> |


**Unique Selling Point**

| **USP** | **Screenshot** |
|---|---|
| Doubt Solver chatbot with STT and TTS in regional language support | <div align="center"><img width="443" height="417" alt="Screenshot 2026-08-10 003043" src="https://github.com/user-attachments/assets/f863b409-cb87-4507-8249-701f97809239" /> </div> |
| Dice Rolling System for deciding the number of questions for daily streak | <img width="1500" height="700" alt="Screenshot 2026-08-10 002447" src="https://github.com/user-attachments/assets/89656768-ed4c-4106-a05a-bf2fc44f353a" /> |
| Platinum Badge earned on getting perfect score and markdown of correct answers w.r.t the student's responses | <img width="1500" height="700" alt="Screenshot 2026-08-10 003200" src="https://github.com/user-attachments/assets/0f874868-3642-4b18-8cc0-ef63c614e7d5" /> | 
| Video Library with regional language support and single-tap offline download support | <img width="1500" height="700" alt="Screenshot 2026-08-10 003633" src="https://github.com/user-attachments/assets/eb36ae81-1165-465c-8ba2-277233d6ace1" /> | 
| Quiz section with MCQ type question and short answer type question that supports TTS and STT in regional languages | <img width="1500" height="700" alt="Screenshot 2026-08-10 003232" src="https://github.com/user-attachments/assets/931f7539-e381-465b-8212-d9234db56651" /> | 
| Heat Maps of student activity with date stamp | <img width="1500" height="700" alt="Screenshot 2026-08-10 004133" src="https://github.com/user-attachments/assets/35a84004-edad-4842-be36-64ed6d310e7a" /> |


### 📱 Mobile responsive

<div align="center">

**Student Portal** </div>

| Home | Quiz | Profile |
|---|---|---|
|<img width="833" height="1600" alt="WhatsApp Image 2026-08-10 at 01 39 05" src="https://github.com/user-attachments/assets/cd0ee392-5526-4690-b5c0-70213d3a422b" /> | <img width="833" height="1600" alt="WhatsApp Image 2026-08-10 at 01 39 06" src="https://github.com/user-attachments/assets/84d9210b-519a-4b08-8393-424116a49665" /> | <img width="770" height="1600" alt="WhatsApp Image 2026-08-10 at 01 39 05 (1)" src="https://github.com/user-attachments/assets/60a36a2f-9121-40d7-a6b1-7127752d5e12" /> |

<div align="center">

**Teacher Portal** </div>

| Home | Video Upload | Student Activity |
|---|---|---|
|<img width="835" height="1600" alt="WhatsApp Image 2026-08-10 at 01 39 06 (1)" src="https://github.com/user-attachments/assets/9225e24a-d5dd-497b-9974-57f06d1dcec1" /> | <img width="838" height="1600" alt="WhatsApp Image 2026-08-10 at 01 39 06 (2)" src="https://github.com/user-attachments/assets/1781f954-c9d1-446f-ac18-c58365e9848f" /> |  <img width="899" height="1599" alt="WhatsApp Image 2026-08-10 at 01 39 07" src="https://github.com/user-attachments/assets/8985c7d0-54d6-40bd-bde6-4f067d8a823b" /> | 

---

## 🏗️ Architecture

<img width="1800" height="2160" alt="image" src="https://github.com/user-attachments/assets/5a42e814-9250-4875-ab38-62061f2fd5b9" />


**Layers, top to bottom:**
1. **Client** - React + Vite PWA (student and teacher screens, offline queue via IndexedDB + service worker)
2. **API** - Express REST API grouped by domain (quiz/Elo, gamification, video, teacher analytics, chat/voice)
3. **Services** - the core business logic (`server/services/*.js`): Elo engine, badge engine, streak engine, dice service, analytics, chat, TTS, translation
4. **Data** - a swappable store: local JSON by default, or Firebase Firestore by setting `USE_FIREBASE=true` and dropping in a service account key - no other code changes needed
5. **External integrations** - all free-tier, no paid keys required: Groq (AI chat), MyMemory (translation), `espeak-ng` (TTS fallback), and the browser's own Web Speech API (STT + native TTS)

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
https://drive.google.com/file/d/1oa3odLcVLiyK9EwParw04zuG0tWPM96n/view?usp=sharing

## 🌐 Live deployment
http://vidyut-4xwl.onrender.com

---
## ⚠️ Known limitations

- Single hardcoded demo student; no real Firebase Auth login screen yet
- Voice output needs `espeak-ng` installed locally for the server-side fallback path
- MCQ distractors are auto-generated, not hand-curated
- AI study helper's "academic questions only" scope is a prompt-level instruction, not a hard technical restriction

---
## Authors

Shakshi Kotwala - [shakshi-06](https://github.com/shakshi-06)
Divya Prasad - [divyaprasad07](https://github.com/divyaprasad07)
Swastika Shaw - [swastikashaw0710-stack](https://github.com/swastikashaw0710-stack)

## 📄 License

MIT License

