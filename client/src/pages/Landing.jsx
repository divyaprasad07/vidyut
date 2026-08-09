// pages/Landing.jsx
//
// Root ("/") landing screen: two paths, student and teacher (teacher on
// its own existing page at /teacher/login). Student side now has two
// modes: log in with an existing email (returning student), or sign up
// with name + email + class (a genuinely new student, not limited to the
// 20 seeded demo accounts). Either path stores the resulting studentId in
// localStorage under STUDENT_ID_KEY; every student page (StudentHome,
// Quiz, Profile, DiceChallenge, VideoLibrary) reads that same key at the
// top of its component function, falling back to the demo student
// "stu_1" only if nothing is stored yet, so opening any of those pages
// directly still works.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { CLASSES } from "../constants";

export const STUDENT_ID_KEY = "vidyut_student_id";
export const STUDENT_NAME_KEY = "vidyut_student_name";

export default function Landing() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [klass, setKlass] = useState(CLASSES[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const enterAs = (studentId, studentName) => {
    localStorage.setItem(STUDENT_ID_KEY, studentId);
    if (studentName) localStorage.setItem(STUDENT_NAME_KEY, studentName);
    navigate("/home");
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.studentLogin(email);
      enterAs(res.studentId, res.name);
    } catch (err) {
      setError("No student found with that email. Check the spelling, or sign up below if you're new here.");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.studentSignup(name, email, klass);
      enterAs(res.studentId, res.name);
    } catch (err) {
      setError(err.message || "Couldn't create your account, please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink mb-1 text-center">Vidyut</h1>
        <p className="font-body text-sm text-slate-600 mb-6 text-center">
          Adaptive learning for every classroom, online or off.
        </p>

        <div className="flex bg-slate-100 rounded-full p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-full font-body text-sm font-semibold transition ${
              mode === "login" ? "bg-ink text-paper" : "text-slate-500"
            }`}
          >
            I have an account
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-2 rounded-full font-body text-sm font-semibold transition ${
              mode === "signup" ? "bg-ink text-paper" : "text-slate-500"
            }`}
          >
            I'm new here
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={submitLogin} className="mb-6">
            <label className="font-body text-sm text-slate-700 mb-1 block">Your email</label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 font-body outline-none focus:border-teal"
            />
            {error && <p className="font-body text-sm text-red-600 mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full bg-ink text-paper font-body font-semibold py-3 rounded-lg disabled:opacity-60"
            >
              {loading ? "Checking..." : "Continue as student"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitSignup} className="mb-6">
            <label className="font-body text-sm text-slate-700 mb-1 block">Your name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 font-body outline-none focus:border-teal mb-3"
            />
            <label className="font-body text-sm text-slate-700 mb-1 block">Your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 font-body outline-none focus:border-teal mb-3"
            />
            <label className="font-body text-sm text-slate-700 mb-1 block">Your class</label>
            <select
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 font-body outline-none focus:border-teal"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {error && <p className="font-body text-sm text-red-600 mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full bg-flame text-night font-body font-semibold py-3 rounded-lg disabled:opacity-60"
            >
              {loading ? "Creating your account..." : "Create my account"}
            </button>
            <p className="font-body text-xs text-slate-500 mt-2 text-center">
              Your video lectures and quizzes will be based on the class you pick here.
            </p>
          </form>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="font-body text-xs text-slate-400">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <Link
          to="/teacher/login"
          className="block w-full text-center border border-slate-300 text-ink font-body font-semibold py-3 rounded-lg"
        >
          Teacher login
        </Link>
      </div>
    </div>
  );
}
