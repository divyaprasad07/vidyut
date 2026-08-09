// dashboard/TeacherAttemptsTable.jsx
export function TeacherAttemptsTable({ attempts }) {
  if (!attempts.length) {
    return <p className="font-body text-sm text-slate-400">No quiz attempts recorded yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-body border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="p-2 font-medium">Date</th>
            <th className="p-2 font-medium">Topic</th>
            <th className="p-2 font-medium">Score</th>
            <th className="p-2 font-medium">Questions</th>
            <th className="p-2 font-medium">Time taken</th>
            <th className="p-2 font-medium">Flag</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="border-b border-slate-100">
              <td className="p-2 text-ink">{new Date(a.timestamp).toLocaleDateString("en-IN")}</td>
              <td className="p-2 text-ink capitalize">{a.topicId.replace("_", " ")}</td>
              <td className="p-2 font-mono text-ink">
                {a.score}/{a.questionsAttempted}
              </td>
              <td className="p-2 text-ink">{a.questionsAttempted}</td>
              <td className="p-2 font-mono text-ink">{a.timeTakenSec}s</td>
              <td className="p-2">
                {a.autoSubmitted && (
                  <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                    Auto-submitted, {a.violationType?.replace("_", " ")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
