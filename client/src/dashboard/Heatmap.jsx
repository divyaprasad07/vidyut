// dashboard/Heatmap.jsx
//
// Class-wide accuracy by topic. Cell shade encodes accuracy (structure as
// information: the darker the cell, the more that class needs attention
// on that topic), a plain register deliberately distinct from the
// gamified student side.

function colorFor(accuracy) {
  // accuracy 0-100 -> a single-hue teal scale, low accuracy = flagged red instead
  if (accuracy < 50) return "bg-red-200 text-red-900";
  if (accuracy < 65) return "bg-amber-100 text-amber-900";
  if (accuracy < 80) return "bg-teal-100 text-teal-900";
  return "bg-teal-300 text-teal-950";
}

export function Heatmap({ classes, topics, accuracyByClassTopic }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-body border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 text-slate-500 font-medium">Class</th>
            {topics.map((t) => (
              <th key={t.id} className="text-left p-2 text-slate-500 font-medium">
                {t.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c}>
              <td className="p-2 font-semibold text-ink">{c}</td>
              {topics.map((t) => {
                const acc = accuracyByClassTopic[c]?.[t.id];
                return (
                  <td key={t.id} className="p-1">
                    <div
                      className={`rounded-md px-3 py-2 text-center font-mono ${
                        acc == null ? "bg-slate-100 text-slate-400" : colorFor(acc)
                      }`}
                    >
                      {acc == null ? "-" : `${acc}%`}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
