// dashboard/DecliningActivityFilter.jsx
import { useEffect, useState } from "react";
import { api } from "../services/api";

export function DecliningActivityFilter({ onSelectStudent }) {
  const [windowDays, setWindowDays] = useState(7);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.declining(windowDays).then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, [windowDays]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="font-body text-sm text-slate-600">Window</label>
        <select
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
          className="border border-slate-300 rounded-md px-2 py-1 text-sm font-body"
        >
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
        </select>
      </div>
      {loading ? (
        <p className="font-body text-sm text-slate-400">Checking recent activity...</p>
      ) : results.length === 0 ? (
        <p className="font-body text-sm text-slate-400">No students showing a decline in this window.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <li
              key={r.studentId}
              onClick={() => onSelectStudent?.(r.studentId)}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 cursor-pointer hover:border-teal"
            >
              <div>
                <p className="font-body font-semibold text-ink">{r.studentName}</p>
                <p className="font-body text-xs text-slate-500">{r.reason}</p>
              </div>
              <div className="font-mono text-xs text-right text-slate-500">
                <div>{r.firstHalfAttempts} to {r.secondHalfAttempts} attempts</div>
                <div>{r.firstHalfAccuracy}% to {r.secondHalfAccuracy}% accuracy</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
