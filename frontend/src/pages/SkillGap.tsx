import { useCallback, useEffect, useMemo, useState } from "react";
import { api, parseError } from "../api/client";
import { PageHeader } from "../components/Layout";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import type { Assessment, Role, SkillStatus } from "../types";

const OPTIONS: { value: SkillStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "mastered", label: "Mastered" },
];

export default function SkillGap() {
  const { refreshUser } = useAuth();
  const { notify } = useToast();
  const [data, setData] = useState<Assessment | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const load = useCallback(async () => {
    try {
      const [a, r] = await Promise.all([api.get<Assessment>("/assessment"), api.get<Role[]>("/roles")]);
      setData(a.data);
      setRoles(r.data);
    } catch (e) {
      notify("error", parseError(e).message);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, Assessment["items"]>();
    data?.items.forEach((i) => map.set(i.category, [...(map.get(i.category) ?? []), i]));
    return [...map.entries()];
  }, [data]);

  async function setStatus(skillId: string, status: SkillStatus) {
    try {
      const { data: next } = await api.put<Assessment>(`/assessment/${skillId}`, { status });
      setData(next);
    } catch (e) {
      notify("error", parseError(e).message);
    }
  }

  async function changeRole(roleId: string) {
    try {
      await api.patch("/profile", { targetRole: roleId });
      await refreshUser();
      await load();
    } catch (e) {
      notify("error", parseError(e).message);
    }
  }

  return (
    <>
      <PageHeader title="Skill Gap Assessor" subtitle="Required skills on the left, your level on the right." />
      {!data ? (
        <p className="muted">Loading skills…</p>
      ) : (
        <>
          <div className="assessor-top">
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="role">Target role</label>
              <select id="role" className="input" value={data.role.id} onChange={(e) => changeRole(e.target.value)}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            {data.criticalGaps.length > 0 ? (
              <div className="banner banner-warn">
                <strong>Critical gaps: {data.criticalGaps.join(", ")}</strong>
                Mark these as In progress to raise your readiness score.
              </div>
            ) : (
              <div className="banner banner-ok">
                <strong>No critical gaps</strong>
                Every critical skill is at least in progress. Readiness: {data.readiness}%.
              </div>
            )}
          </div>

          <section className="card">
            {data.items.length === 0 && (
              <p className="empty">
                {data.role.isCustom
                  ? "Your custom role has no skills yet. Add some in Profile Settings."
                  : "This role has no required skills."}
              </p>
            )}
            {groups.map(([category, items]) => (
              <div key={category}>
                <h3 className="cat">{category}</h3>
                {items.map((item) => (
                  <div className="skill-row" key={item.skillId}>
                    <span className="skill-name">
                      {item.name}
                      <span className={`tag imp-${item.importance}`}>{item.importance === "critical" ? "Critical" : "Important"}</span>
                    </span>
                    <div className="seg" role="group" aria-label={`${item.name} level`}>
                      {OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          aria-pressed={item.status === o.value}
                          className={item.status === o.value ? `on-${o.value}` : ""}
                          onClick={() => item.status !== o.value && setStatus(item.skillId, o.value)}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}