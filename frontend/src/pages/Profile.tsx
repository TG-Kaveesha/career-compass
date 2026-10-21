import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, parseError } from "../api/client";
import Field from "../components/Field";
import { PageHeader } from "../components/Layout";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { tagClass } from "../lib/format";
import type { CustomSkill, Role, SessionInfo } from "../types";

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Graduate"];
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { notify } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [account, setAccount] = useState({ name: "", email: "", targetRole: "", academicYear: "Year 1" });
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [skills, setSkills] = useState<CustomSkill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillError, setSkillError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  const loadSessions = useCallback(async () => {
    const { data } = await api.get<SessionInfo[]>("/profile/sessions");
    setSessions(data);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<Role[]>("/roles"),
      api.get<{ customSkills: CustomSkill[] }>("/profile"),
      loadSessions(),
    ])
      .then(([r, p]) => { setRoles(r.data); setSkills(p.data.customSkills); })
      .catch((e) => notify("error", parseError(e).message));
  }, [loadSessions, notify]);

  useEffect(() => {
    if (user) setAccount({ name: user.name, email: user.email, targetRole: user.targetRole.id, academicYear: user.academicYear });
  }, [user]);

  async function saveAccount(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (account.name.trim().length < 2) local.name = "Enter your name";
    if (!EMAIL_RX.test(account.email)) local.email = "Enter a valid email address";
    setAccountErrors(local);
    if (Object.keys(local).length) return;
    try {
      await api.patch("/profile", account);
      await refreshUser();
      notify("success", "Changes saved");
    } catch (err) {
      const info = parseError(err);
      setAccountErrors(info.fields);
      if (!Object.keys(info.fields).length) notify("error", info.message);
    }
  }

  async function addSkill(e: FormEvent) {
    e.preventDefault();
    if (newSkill.trim().length < 2) return setSkillError("Skill must be at least 2 characters");
    try {
      const { data } = await api.post<{ customSkills: CustomSkill[] }>("/profile/custom-skills", { name: newSkill });
      setSkills(data.customSkills);
      setNewSkill("");
      setSkillError("");
    } catch (err) {
      const info = parseError(err);
      setSkillError(info.fields.name ?? info.message);
    }
  }

  async function removeSkill(id: string) {
    try {
      const { data } = await api.delete<{ customSkills: CustomSkill[] }>(`/profile/custom-skills/${id}`);
      setSkills(data.customSkills);
    } catch (err) {
      notify("error", parseError(err).message);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return setPasswordError("Use 8+ characters with a letter and a number");
    }
    try {
      await api.put("/profile/password", { newPassword: password });
      setPassword("");
      setPasswordError("");
      notify("success", "Password changed. Other devices were signed out.");
      await loadSessions();
    } catch (err) {
      const info = parseError(err);
      setPasswordError(info.fields.newPassword ?? info.message);
    }
  }

  async function revoke(id: string) {
    try {
      await api.delete(`/profile/sessions/${id}`);
      await loadSessions();
    } catch (err) {
      notify("error", parseError(err).message);
    }
  }

  return (
    <>
      <PageHeader title="Profile and Settings" subtitle="Manage your account and target role." />
      <div className="grid-2" style={{ alignItems: "start" }}>
        <form className="card" onSubmit={saveAccount} noValidate>
          <h2>Account info</h2>
          <Field label="Name" htmlFor="p-name" error={accountErrors.name}>
            <input id="p-name" className={`input${accountErrors.name ? " invalid" : ""}`} value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="p-email" error={accountErrors.email}>
            <input id="p-email" type="email" className={`input${accountErrors.email ? " invalid" : ""}`} value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
          </Field>
          <Field label="Target role" htmlFor="p-role" error={accountErrors.targetRole}>
            <select id="p-role" className="input" value={account.targetRole} onChange={(e) => setAccount({ ...account, targetRole: e.target.value })}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Academic status" htmlFor="p-year" error={accountErrors.academicYear}>
            <select id="p-year" className="input" value={account.academicYear} onChange={(e) => setAccount({ ...account, academicYear: e.target.value })}>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </Field>
          <button className="btn">Save changes</button>
        </form>

        <div style={{ display: "grid", gap: 16 }}>
          <section className="card">
            <h2>Custom role skills</h2>
            <p className="muted">Add or remove skills for a custom target position. Choose "Custom Role" as your target role to assess them.</p>
            <div className="skill-chips">
              {skills.length === 0 && <span className="empty" style={{ padding: 0 }}>No custom skills yet.</span>}
              {skills.map((s) => (
                <span key={s.id} className={`${tagClass(s.name)} skill-chip`}>
                  {s.name}
                  <button aria-label={`Remove ${s.name}`} onClick={() => removeSkill(s.id)}>×</button>
                </span>
              ))}
            </div>
            <form className="inline-form" onSubmit={addSkill} noValidate>
              <Field label="" htmlFor="p-skill" error={skillError}>
                <input id="p-skill" aria-label="New skill" className={`input${skillError ? " invalid" : ""}`} placeholder="New skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
              </Field>
              <button className="btn">Add</button>
            </form>
          </section>

          <section className="card">
            <h2>Security</h2>
            <form onSubmit={changePassword} noValidate>
              <Field label="New password" htmlFor="p-pass" error={passwordError}>
                <input id="p-pass" type="password" className={`input${passwordError ? " invalid" : ""}`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </Field>
              <button className="btn">Change password</button>
            </form>
            <div style={{ marginTop: 18 }}>
              {sessions.map((s) => (
                <div className="session" key={s.id}>
                  <span>{s.device} · {s.location} {s.current && <span className="tag tag-1">This device</span>}</span>
                  {!s.current && <button className="btn btn-outline btn-sm" onClick={() => revoke(s.id)}>Revoke</button>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}