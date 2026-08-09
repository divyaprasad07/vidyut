// pages/Landing.jsx
//
// Root ("/") landing screen: two paths, student (email) and teacher (PIN,
// on its own existing page at /teacher/login). A successful student login
// stores the studentId in localStorage under STUDENT_ID_KEY; every student
// page (StudentHome, Quiz, Profile, DiceChallenge, VideoLibrary) reads that
// same key at the top of its component function, falling back to the demo
// student "stu_1" if nothing is stored yet, so opening any of those pages
// directly still works exactly as before.
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";

export const STUDENT_ID_KEY = "vidyut_student_id";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.studentLogin(email);
      localStorage.setItem(STUDENT_ID_KEY, res.studentId);
      navigate("/home");
    } catch (err) {
      setError("No student found with that email. Check the spelling and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink mb-1 text-center">Vidyut</h1>
        <p className="font-body text-sm text-slate-600 mb-8 text-center">
          Adaptive learning for every classroom, online or off.
        </p>

        <form onSubmit={submit} className="mb-6">
          <label className="font-body text-sm text-slate-700 mb-1 block">
            Student login
          </label>
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
