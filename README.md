# Vidyut — local setup

Two apps: `server/` (Express + local JSON data store, swappable to real
Firestore) and `client/` (Vite + React).

## 1. Server

```
cd server
npm install
npm run seed      # generates 20 students, 5 topics, 50 questions into server/data/db.json
npm start         # listens on :4000
```

Quick sanity check once it's running: `curl localhost:4000/api/health`
should return `{"ok":true,"dbMode":"local-json"}`.

Teacher PIN for the demo teacher account: `1234`.

For the voice-output feature (section 6 below) to actually speak, you'll
also need `espeak-ng` installed, see section 6 for the one-time Windows
install step. Everything else works without it.

To point at real Firebase Firestore instead of the local JSON file: drop a
service account key at `server/serviceAccount.json`, then run with
`USE_FIREBASE=true npm start`. Nothing else needs to change, see the
comments at the top of `server/services/db.js`.

## 2. Client

In a second terminal:

```
cd client
npm install
npm run dev        # Vite dev server on :5173, proxies /api to :4000
```

Open `http://localhost:5173`. The student home screen loads as `stu_1`
(Aarav Sharma), hardcoded for the demo, see the note at the top of
`client/src/App.jsx` for how to swap in real Firebase Auth.

Teacher dashboard: `http://localhost:5173/teacher/login`, PIN `1234`.

## 3. Things worth testing by hand that I couldn't verify in a sandboxed
   environment without a real browser:

- **Offline quiz taking**: start a quiz, then use devtools' Network tab to
  go offline mid-quiz, keep answering, confirm the "Offline, X answers
  queued" indicator appears, then go back online and confirm it syncs and
  the rating updates.
- **Quiz integrity**: start a quiz, switch to another browser tab (or
  minimize the window), then come back. You should see a warning modal
  ("Warning 1 of 2") rather than an immediate submit, since leaving the
  screen can easily happen by accident (a notification, a misclick, a
  network hiccup). Dismiss it and do it again, you should see "Warning 2
  of 2". Do it a third time and NOW it auto-submits with whatever was
  answered so far, and the results screen explains that two warnings
  were given first. The teacher dashboard's per-student quiz history
  should show that attempt flagged as auto-submitted. I could not
  trigger real browser tab-switch/PiP events from this sandbox, so the
  warning-counting logic was verified in isolation (2 warnings, submit
  on the 3rd, correctly ignores anything after) but the actual UI has
  not been seen firing in a real browser, that's the one thing to watch
  closely here.
- **PWA install**: confirm the browser offers to install the app, and
  that a second load works with the network fully disabled (app shell
  should still render from the service worker cache).

## 4. Video lectures

Student side: click the video icon (top right, next to the profile avatar)
or go to `http://localhost:5173/videos`. Filter by subject and language.

Teacher side: on the dashboard, the "Video lecture library" section has a
real upload form (file picker + title/subject/class/chapter/language) that
uploads to `server/uploads/` and appears in the library immediately.

The seed data includes 6 sample lecture clips already, covering all 6
languages (en/hi/bn/mr/ta/te), so the library isn't empty on first load.
Honest limitation: those 6 clips are short synthesized placeholder footage
(a color-bar test pattern with an on-screen label), not real recorded
lectures, since this environment can't produce actual teaching video. The
metadata around them (titles, subjects, classes, chapters, teacher name)
is real. They're shipped pre-rendered in `server/uploads/seed/` in this
zip, so `npm run seed` does not need `ffmpeg` installed to work, it only
tries to generate them if those files are missing, and skips gracefully
(with a console warning) if `ffmpeg` isn't on your machine.

## 5. Quiz question style

On the home screen, above "Start adaptive quiz", there's a "Question
style" picker: Multiple choice, Short answer, or Mixed (default). Mixed
randomly varies per question within one quiz. Every question in the seed
data has 4 MCQ options generated alongside its free-text answer, so all
three modes work on the same question bank; scoring is the same
case-insensitive match either way.

## 6. Vernacular voice interaction

There's a "Voice language" picker on the home screen (English, Hindi,
Bengali, Marathi, Tamil, Telugu), carried into the quiz. On each question,
a speaker button reads it aloud, and short-answer mode has a mic button
that fills the text box from speech.

**Speech output (speak) prefers your browser's own voice, falls back to
`espeak-ng` on the server.** This evolved in two steps, worth knowing
both: originally the browser's own speechSynthesis silently fell back to
whatever English voice was installed when a language had no voice pack
on that machine, with no error, so selecting Hindi could just quietly
speak English. The fix was routing everything through `espeak-ng`
instead, which ships its own voice data for all 6 languages so it never
depends on what's installed locally, completely free, no API key. That
made it reliable, but every language then sounded the same fairly
robotic way, `espeak-ng`'s Indic-language voices use a basic phoneme
model that can sound more like an English speaker's approximation than
a native voice.

The current behavior (`hybrid` provider,
`client/src/services/languageProvider/hybridProvider.js`) tries to get
the best of both: before speaking, it checks the browser's actual
installed voice list for a genuine match (not just "some voice exists"),
and uses that if found, since browsers like Edge often ship much more
natural cloud-backed voices for Hindi and other Indian languages. Only
when no real match exists does it fall back to `espeak-ng`. This
preserves the original fix (it can't silently end up speaking English
for a language it doesn't have, because it's checking the real voice
list first, not just assuming one), while sounding noticeably better
whenever your machine happens to have a good voice installed. **Whether
you actually get the better voice depends on what's on your Windows
machine** — if Hindi still sounds robotic after this update, check
Windows Settings > Time & Language > Language & region, and see if
adding the Hindi (or other) language pack installs a matching voice;
that's outside anything this app controls.

### This needs one manual install step on your machine (for the espeak-ng fallback)

`espeak-ng` is not bundled with Node, you need it installed separately
so the fallback path works even where your browser has no matching
voice:

1. Download the Windows installer from
   https://github.com/espeak-ng/espeak-ng/releases (the latest release's
   `.msi` file, e.g. `espeak-ng-X.X.X.msi`).
2. Run it (default options are fine).
3. **Close and reopen your server terminal** (PATH changes need a fresh
   terminal), then run `espeak-ng --version` to confirm it's found.
4. Restart the server (`npm start`).

If you skip this, the app doesn't break, the speaker button will show
"Voice output isn't available right now" for any language your browser
also can't speak natively, since the server checks and reports failure
rather than crashing. But you do need this step for full reliability
across all 6 languages.

**Speech input (mic/listen) is unchanged**, still the browser's own
SpeechRecognition, since there's no free no-API-key server-side
alternative worth building here. That part only needs your browser to
support it (Chrome/Edge do), nothing to install.

Other things worth knowing:
- **The voice reads whatever text is stored**, it doesn't translate.
  Selecting Hindi voice on a Math question (whose text is stored in
  English) will pronounce the English text with a Hindi accent, not
  translate it. It sounds right and natural only for the Hindi-topic
  questions, which are genuinely authored in Hindi. Real per-question
  translation into all 6 languages is a content task, not built here,
  see the `translations: { en, hi, ... }` field already on each question
  in `seedData.js` if you want to fill that in later.
- To go back to pure browser TTS instead of the server, set
  `VITE_LANGUAGE_PROVIDER=webspeech` in the client's environment. A
  Bhashini option is still scaffolded (`VITE_LANGUAGE_PROVIDER=bhashini`)
  for if you get an official API key later, but it's unfinished, see
  `client/src/services/languageProvider/bhashiniProvider.js`.

## 7. Answer review

At the end of a quiz (or after an early auto-submit), the results screen
shows a full breakdown: every question, whether you got it right or
wrong, your submitted answer, and the correct answer for anything you
missed. This is a deliberate choice over showing correctness after each
question, since revealing the correct answer mid-quiz would mean sending
it to the browser before the quiz is over, which undermines the
quiz-integrity design (the correct answer is deliberately stripped from
every question payload until scoring happens server-side). If your
attempt gets queued offline, the review isn't available until it syncs,
since it comes back as part of the server's scoring response.

## 8. Quiz-integrity warnings

Leaving the quiz screen (switching tabs, minimizing) no longer
auto-submits immediately. The first two times, you get a clearly visible
warning modal explaining what happened and how many chances remain,
since this can easily happen by accident (a notification, a misclick, a
brief network hiccup). Only the **third** occurrence actually
auto-submits, and the results screen explains that two warnings were
given first. I could not trigger real browser tab-switch/PiP events from
the build sandbox, so the warning-counting logic itself was verified in
isolation, but the actual modal has not been seen firing in a real
browser, test this by switching tabs three times and confirming it warns
twice then submits on the third.

## 9. AI study helper (chat)

A small floating chat button (bottom-right) on the student-facing
screens, for academic doubts, "explain how photosynthesis works,"
"why does 2x + 5 = 15 mean x = 5," across all 5 subjects. Kept
deliberately light: no chat history is saved anywhere, no new database
collection, the conversation lives only in the browser tab and clears on
reload. Uses Groq's free-tier chat API.

**Hidden on purpose** during an active quiz (`/quiz/*`) and on the
teacher dashboard, an always-available "ask AI" button during a quiz
would be a direct way to get answers, which would defeat the
quiz-integrity system elsewhere in this app.

### Setup (one-time)

1. Go to https://console.groq.com, sign up (free), and create an API key.
2. In `server/`, create a file named `.env` (if it doesn't exist) with:
   ```
   GROQ_API_KEY=your_key_here
   ```
3. Restart the server.

If you skip this, the app doesn't break, students just see "The study
helper isn't set up yet" if they try to use it, since the server checks
and reports this rather than crashing.

**Scope, not just capability**: the assistant is instructed (via a
system prompt) to only help with schoolwork, and to gently redirect to a
teacher or trusted adult rather than attempt to counsel a student who
seems distressed. This is a prompt-level instruction, not a hard
technical guarantee, worth knowing if you plan to rely on it for
anything beyond a demo.

### Voice: ask in your language, listen back in your language

The chat panel has a language picker (English, Hindi, Bengali, Marathi,
Tamil, Telugu). The mic button next to the input transcribes your
spoken question into that language and fills the text box (it doesn't
auto-send, so you can check/edit a misheard transcript first). The
assistant's text replies are always in English (enforced in the system
prompt), but every reply has a small speaker icon, click it and it
translates that reply into whichever language the picker is set to and
reads it aloud, so you can ask in Hindi and listen back in Hindi even
though the words on screen stay English.

This reuses the same `espeak-ng` text-to-speech and browser speech
recognition already set up for the quiz's voice feature (section 6), so
if that's working there, it'll work here too, no extra setup for those
two pieces. Translation is new here though, the quiz's voice feature
deliberately does not translate (see section 6), but this chat feature
does, since an English-only chat would defeat the point of asking in
your own language. It uses the free MyMemory API for that translation
step. **This could not be tested from the build sandbox**, since that
domain isn't reachable from here, so speaking a reply back in a
non-English language is a genuine first real-world test. If translation
fails, it falls back to speaking the original English text rather than
staying silent.

## 10. Known simplifications (see the honest status write-up in chat)

- Data store is local JSON, not live Firestore, until you provide a
  service account key.
- Single hardcoded demo student, no real Firebase Auth login screen yet.
- Vernacular voice UI exists (see section 6 above); speech output needs
  `espeak-ng` installed on your machine (one-time setup, see section 6),
  speech input uses your browser's built-in speech recognition.
- MCQ distractors are auto-generated (nearby numbers for numeric answers,
  other real answers from the same topic for text answers), not
  hand-curated, so occasionally one option looks obviously out of place.
- The AI study helper (section 9) needs a free Groq API key to actually
  respond, and its "academic questions only" scope is a prompt-level
  instruction, not a hard technical restriction.
