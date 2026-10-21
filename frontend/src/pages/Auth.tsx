import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, parseError } from "../api/client";
import Field from "../components/Field";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Graduate"];
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Record<string, string>;

export default function Auth() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"register" | "login">("register");
  const [roles, setRoles] = useState<Role[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const [reg, setReg] = useState({ name: "", email: "", password: "", targetRole: "", academicYear: "Year 1" });
  const [log, setLog] = useState({ email: "", password: "", remember: false });

  useEffect(() => {
    api.get<Role[]>("/roles").then(({ data }) => {
      setRoles(data);
      const junior = data.find((r) => r.name === "Junior Web Developer") ?? data[0];
      if (junior) setReg((r) => (r.targetRole ? r : { ...r, targetRole: junior.id }));
    }).catch(() => setFormError("Could not load roles. Is the backend running?"));
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const switchTab = (t: "register" | "login") => {
    setTab(t);
    setErrors({});
    setFormError("");
  };

  async function submit(e: FormEvent, action: () => Promise<void>, local: Errors) {
    e.preventDefault();
    setFormError("");
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await action();
      navigate("/dashboard");
    } catch (err) {
      const info = parseError(err);
      setErrors(info.fields);
      setFormError(info.message);
    } finally {
      setBusy(false);
    }
  }

  const onRegister = (e: FormEvent) => {
    const local: Errors = {};
    if (reg.name.trim().length < 2) local.name = "Enter your full name";
    if (!EMAIL_RX.test(reg.email)) local.email = "Enter a valid email address";
    if (reg.password.length < 8) local.password = "Password must be at least 8 characters";
    else if (!/[A-Za-z]/.test(reg.password) || !/\d/.test(reg.password)) local.password = "Use at least one letter and one number";
    if (!reg.targetRole) local.targetRole = "Choose a target role";
    return submit(e, () => register(reg), local);
  };

  const onLogin = (e: FormEvent) => {
    const local: Errors = {};
    if (!EMAIL_RX.test(log.email)) local.email = "Enter a valid email address";
    if (!log.password) local.password = "Enter your password";
    return submit(e, () => login(log.email, log.password, log.remember), local);
  };

  const cls = (k: string) => `input${errors[k] ? " invalid" : ""}`;

  return (
    <main className="auth-page">
      <div className="auth-wrap">
        <div className="auth-top">
          <Logo />
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "register"} className={tab === "register" ? "active" : ""} onClick={() => switchTab("register")}>Register</button>
            <button role="tab" aria-selected={tab === "login"} className={tab === "login" ? "active" : ""} onClick={() => switchTab("login")}>Login</button>
          </div>
        </div>

        {tab === "register" ? (
          <form className="card" onSubmit={onRegister} noValidate>
            <h2>Create account</h2>
            {formError && <div className="form-error" role="alert">{formError}</div>}
            <Field label="Full name" htmlFor="r-name" error={errors.name}>
              <input id="r-name" className={cls("name")} value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} autoComplete="name" />
            </Field>
            <Field label="Email" htmlFor="r-email" error={errors.email}>
              <input id="r-email" type="email" className={cls("email")} value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} autoComplete="email" />
            </Field>
            <Field label="Password" htmlFor="r-pass" error={errors.password}>
              <input id="r-pass" type="password" className={cls("password")} value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} autoComplete="new-password" />
            </Field>
            <Field label="Target career role" htmlFor="r-role" error={errors.targetRole}>
              <select id="r-role" className={cls("targetRole")} value={reg.targetRole} onChange={(e) => setReg({ ...reg, targetRole: e.target.value })}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Academic year" htmlFor="r-year" error={errors.academicYear}>
              <select id="r-year" className={cls("academicYear")} value={reg.academicYear} onChange={(e) => setReg({ ...reg, academicYear: e.target.value })}>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </Field>
            <button className="btn btn-block" disabled={busy}>{busy ? "Creating account…" : "Register"}</button>
          </form>
        ) : (
          <form className="card" onSubmit={onLogin} noValidate>
            <h2>Welcome back</h2>
            {formError && <div className="form-error" role="alert">{formError}</div>}
            <Field label="Email" htmlFor="l-email" error={errors.email}>
              <input id="l-email" type="email" className={cls("email")} value={log.email} onChange={(e) => setLog({ ...log, email: e.target.value })} autoComplete="email" />
            </Field>
            <Field label="Password" htmlFor="l-pass" error={errors.password}>
              <input id="l-pass" type="password" className={cls("password")} value={log.password} onChange={(e) => setLog({ ...log, password: e.target.value })} autoComplete="current-password" />
            </Field>
            <label className="check">
              <input type="checkbox" checked={log.remember} onChange={(e) => setLog({ ...log, remember: e.target.checked })} />
              Remember me
            </label>
            <button className="btn btn-block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
          </form>
        )}
      </div>
    </main>
  );
}