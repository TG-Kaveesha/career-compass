import { useEffect, useState } from "react";
import { api, parseError } from "../api/client";
import { PageHeader } from "../components/Layout";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { formatDate, timeAgo } from "../lib/format";
import type { DashboardData } from "../types";

const RADIUS = 62;
const CIRC = 2 * Math.PI * RADIUS;

export default function Dashboard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>("/dashboard").then((r) => setData(r.data)).catch((e) => notify("error", parseError(e).message));
  }, [notify]);

  const hint = !data
    ? ""
    : data.readiness >= 80
    ? "You have passed the 80% readiness mark. Keep it up."
    : data.criticalGaps.length
    ? `Close ${data.criticalGaps.length} critical gap${data.criticalGaps.length > 1 ? "s" : ""} to pass 80%.`
    : "Move skills to Mastered to pass 80%.";

  return (
    <>
      <PageHeader title={`Welcome back, ${user?.name.split(" ")[0]}!`} subtitle="Here is where you stand today." />
      {!data ? (
        <p className="muted">Loading your dashboard…</p>
      ) : (
        <>
          <div className="dash-top">
            <section className="card readiness">
              <div className="donut">
                <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={`${data.readiness}% ready`}>
                  <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#e5e0fb" strokeWidth="16" />
                  <circle
                    cx="70" cy="70" r={RADIUS} fill="none" stroke="#5b3fe0" strokeWidth="16" strokeLinecap="round"
                    strokeDasharray={`${(data.readiness / 100) * CIRC} ${CIRC}`} transform="rotate(-90 70 70)"
                  />
                </svg>
                <div className="donut-label"><strong>{data.readiness}%</strong><span>ready</span></div>
              </div>
              <div>
                <span className="badge">CAREER READINESS</span>
                <h2>Ready for {data.targetRole}</h2>
                <p className="muted">{hint}</p>
              </div>
            </section>

            <section className="stat-card">
              <h2>Skills mastered</h2>
              <p><span className="stat-big">{data.mastered}</span> of {data.total}</p>
              <div className="progress"><div style={{ width: `${data.total ? (data.mastered / data.total) * 100 : 0}%` }} /></div>
              <p>{data.total - data.mastered} remaining</p>
            </section>
          </div>

          <div className="grid-2">
            <section className="card">
              <h2>Upcoming milestones</h2>
              {data.upcoming.length === 0 ? (
                <p className="empty">Nothing planned yet. Add a milestone on the Milestones Board.</p>
              ) : (
                <ul className="list">
                  {data.upcoming.map((m, i) => (
                    <li key={m.id}><span className={`dot dot-${i % 4}`} />{m.title}<span className="when">{formatDate(m.dueDate)}</span></li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card">
              <h2>Recent activity</h2>
              {data.activity.length === 0 ? (
                <p className="empty">Your activity will show up here as you update skills and milestones.</p>
              ) : (
                <ul className="list">
                  {data.activity.map((a, i) => (
                    <li key={a.id}><span className={`dot dot-${(i + 3) % 4}`} />{a.message}<span className="when">{timeAgo(a.createdAt)}</span></li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}