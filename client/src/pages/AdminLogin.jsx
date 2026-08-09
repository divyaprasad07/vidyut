// pages/AdminLogin.jsx
//
// The PIN is a shared staff access code, not a per-teacher credential, so
// after it's verified, the teacher types their own name here rather than
// the dashboard showing a fixed seeded name. That entered name is what
// gets stored in sessionStorage and used everywhere the teacher's name
// appears (dashboard header, video-upload attribution), the server never
// needs to know it.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    try {
      const res = await api.teacherLogin(pin);
      sessionStorage.setItem(
        "teacher",
        JSON.stringify({ ...res.teacher, name: name.trim() })
      );
      navigate("/teacher");
    } catch (err) {
      setError("That PIN didn't work. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-xs">
        <h1 className="font-display text-2xl text-ink mb-1">Teacher access</h1>
        <p className="font-body text-sm text-slate-600 mb-6">
          Enter the staff PIN and your own name. This is a separate login from the student app.
        </p>

        <label className="font-body text-sm text-slate-700 mb-1 block">Your name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 font-body outline-none focus:border-teal mb-4"
        />

        <label className="font-body text-sm text-slate-700 mb-1 block">Staff PIN</label>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 font-mono text-lg tracking-widest text-center outline-none focus:border-teal"
        />
        {error && <p className="font-body text-sm text-red-600 mt-2">{error}</p>}
        <button
          type="submit"
          className="mt-4 w-full bg-ink text-paper font-body font-semibold py-3 rounded-lg"
        >
          Enter dashboard
        </button>
      </form>
    </div>
  );
}
