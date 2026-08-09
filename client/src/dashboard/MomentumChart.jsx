// dashboard/MomentumChart.jsx
//
// Substitutes for the mockup's Plotly "Learning Momentum" chart: same
// visual idea (minutes studied per day, last 7 days), but built with
// Recharts, which is already a dependency used elsewhere (teacher
// dashboard's rating charts). Adding Plotly as a second charting library
// just to match one chart's original implementation would be pure bloat
// for no real benefit. Data is real, computed server-side from actual
// quiz attempt timestamps, not the mockup's hardcoded sample numbers.
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function MomentumChart({ data }) {
  const chartData = data.map((d) => ({
    label: new Date(d.day).toLocaleDateString("en-IN", { weekday: "short" }),
    minutes: d.minutes,
  }));

  const allZero = chartData.every((d) => d.minutes === 0);

  return (
    <div className="h-56 w-full relative">
      {allZero && (
        <p className="absolute inset-0 flex items-center justify-center font-body text-sm text-slate-400 z-10">
          No quiz time recorded in the last 7 days yet.
        </p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#008080" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#008080" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94A3B8", fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#94A3B8", fontWeight: 700 }} axisLine={false} tickLine={false} unit="m" />
          <Tooltip formatter={(v) => [`${v} min`, "Studied"]} />
          <Area type="monotone" dataKey="minutes" stroke="#008080" strokeWidth={3} fill="url(#momentumFill)" dot={{ r: 4, fill: "#008080" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
