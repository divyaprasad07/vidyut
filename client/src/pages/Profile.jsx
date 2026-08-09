// pages/Profile.jsx
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Stone } from "../gamification/Stone";
import { StreakFlame } from "../gamification/StreakFlame";
import { OfflineIndicator } from "../components/OfflineIndicator";

const STUDENT_ID = "stu_1";
const TIER_ORDER = ["bronze", "silver", "gold", "diamond"];

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [badgeData, setBadgeData] = useState(null);

  useEffect(() => {
    api.student(STUDENT_ID).then(setStudent);
    api.badges(STUDENT_ID).then(setBadgeData);
  }, []);

  if (!student || !badgeData) {
    return <div className="min-h-screen bg-night flex items-center justify-center text-paper font-body">Loading...</div>;
  }

  const totalStones = badgeData.badges.reduce((sum, b) => sum + b.tiers.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-night to-dusk px-6 py-10">
      <OfflineIndicator />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full bg-flame/20 ring-2 ring-flame flex items-center justify-center font-display text-2xl text-flame">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-display text-2xl text-paper">{student.name}</h1>
            <p className="font-body text-sm text-slate-400">
              {student.class} · {totalStones} stone{totalStones === 1 ? "" : "s"} collected
            </p>
          </div>
        </div>

        <div className="mt-4 mb-8">
          <StreakFlame current={student.streak.current} longest={student.streak.longest} />
        </div>

        <h2 className="font-display text-lg text-paper mb-4">Your collection</h2>
        <div className="flex flex-col gap-8">
          {badgeData.badges.map((topicBadge) => (
            <div key={topicBadge.topic}>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-display text-paper">{topicBadge.topicName}</h3>
                <span className="font-mono text-xs text-slate-400">
                  {topicBadge.masteryPercent}% mastery · rating {topicBadge.rating}
                </span>
              </div>
              <div className="flex gap-4 flex-wrap">
                {TIER_ORDER.map((tierId) => {
                  const meta = badgeData.allTiers.find((t) => t.id === tierId);
                  const earned = topicBadge.tiers.some((t) => t.id === tierId);
                  return (
                    <Stone
                      key={tierId}
                      tier={tierId}
                      earned={earned}
                      label={meta.label}
                      flavor={meta.flavor}
                      pulse={earned && tierId === "diamond"}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
