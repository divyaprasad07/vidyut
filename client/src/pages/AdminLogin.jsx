// pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.teacherLogin(pin);
      sessionStorage.setItem("teacher", JSON.stringify(res.teacher));
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
          Enter your admin PIN. This is a separate login from the student app.
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
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
