// dashboard/RatingLineChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function RatingLineChart({ history, topicName }) {
  const data = history.map((h) => ({
    date: new Date(h.ts).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    rating: h.rating,
  }));

  if (data.length < 2) {
    return <p className="font-body text-sm text-slate-400">Not enough attempts yet to chart progression in {topicName}.</p>;
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={["dataMin - 30", "dataMax + 30"]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="rating" stroke="#14B8A6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
