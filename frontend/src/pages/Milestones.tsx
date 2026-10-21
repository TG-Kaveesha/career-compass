import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, parseError } from "../api/client";
import Field from "../components/Field";
import { PageHeader } from "../components/Layout";
import Modal, { ConfirmDialog } from "../components/Modal";
import { useToast } from "../components/Toast";
import { formatDate, tagClass, toDateInput } from "../lib/format";
import type { Assessment, Milestone, MilestoneStatus } from "../types";

const COLUMNS: { status: MilestoneStatus; title: string }[] = [
  { status: "todo", title: "To do" },
  { status: "in_progress", title: "In progress" },
  { status: "completed", title: "Completed" },
];

interface FormState { title: string; skillTag: string; dueDate: string; status: MilestoneStatus }
const EMPTY: FormState = { title: "", skillTag: "", dueDate: "", status: "todo" };

export default function Milestones() {
  const { notify } = useToast();
  const [items, setItems] = useState<Milestone[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Milestone | "new" | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [overCol, setOverCol] = useState<MilestoneStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const [m, a] = await Promise.all([api.get<Milestone[]>("/milestones"), api.get<Assessment>("/assessment")]);
      setItems(m.data);
      setSkills(a.data.items.map((i) => i.name));
    } catch (e) {
      notify("error", parseError(e).message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  function openForm(target: Milestone | "new") {
    setErrors({});
    setForm(target === "new" ? EMPTY : { title: target.title, skillTag: target.skillTag, dueDate: toDateInput(target.dueDate), status: target.status });
    setEditing(target);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 3) return setErrors({ title: "Title must be at least 3 characters" });
    setBusy(true);
    try {
      const body = { ...form, dueDate: form.dueDate || null };
      if (editing === "new") {
        await api.post("/milestones", body);
        notify("success", "Milestone added");
      } else if (editing) {
        await api.put(`/milestones/${editing.id}`, body);
        notify("success", "Milestone updated");
      }
      setEditing(null);
      await load();
    } catch (err) {
      const info = parseError(err);
      setErrors(info.fields);
      if (!Object.keys(info.fields).length) notify("error", info.message);
    } finally {
      setBusy(false);
    }
  }

  async function move(id: string, status: MilestoneStatus) {
    const current = items.find((m) => m.id === id);
    if (!current || current.status === status) return;
    setItems((list) => list.map((m) => (m.id === id ? { ...m, status } : m))); // optimistic
    try {
      await api.patch(`/milestones/${id}/status`, { status });
    } catch (err) {
      notify("error", parseError(err).message);
      load();
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await api.delete(`/milestones/${deleting.id}`);
      notify("success", "Milestone deleted");
      setDeleting(null);
      await load();
    } catch (err) {
      notify("error", parseError(err).message);
    }
  }

  return (
    <>
      <PageHeader title="Milestones Board" subtitle="Drag cards across as you learn." />
      <button className="btn" onClick={() => openForm("new")}>+ Add New Milestone</button>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading milestones…</p>
      ) : (
        <div className="board">
          {COLUMNS.map((col) => {
            const cards = items.filter((m) => m.status === col.status);
            return (
              <section
                key={col.status}
                className={`column col-${col.status}${overCol === col.status ? " over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.status); }}
                onDragLeave={() => setOverCol(null)}
                onDrop={(e) => { e.preventDefault(); setOverCol(null); move(e.dataTransfer.getData("text/plain"), col.status); }}
              >
                <h2>{col.title}<span>{cards.length}</span></h2>
                {cards.length === 0 && <p style={{ opacity: .7 }}>Drop a card here.</p>}
                {cards.map((m) => (
                  <article key={m.id} className="mcard" draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", m.id)}>
                    <div className="mcard-row">
                      <input
                        type="checkbox"
                        checked={m.status === "completed"}
                        aria-label={`Mark "${m.title}" ${m.status === "completed" ? "not complete" : "complete"}`}
                        onChange={() => move(m.id, m.status === "completed" ? "todo" : "completed")}
                      />
                      <span className="mcard-title">{m.title}</span>
                    </div>
                    <div className="mcard-meta">
                      {m.skillTag && <span className={tagClass(m.skillTag)}>#{m.skillTag}</span>}
                      <span>{m.status === "completed" ? "Done" : `Due ${formatDate(m.dueDate)}`}</span>
                    </div>
                    <div className="mcard-actions">
                      <button className="link-btn" onClick={() => openForm(m)}>Edit</button>
                      <button className="link-btn danger" onClick={() => setDeleting(m)}>Delete</button>
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal title={editing === "new" ? "Add milestone" : "Edit milestone"} onClose={() => setEditing(null)}>
          <form onSubmit={save} noValidate>
            <Field label="Title" htmlFor="m-title" error={errors.title}>
              <input id="m-title" className={`input${errors.title ? " invalid" : ""}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
            </Field>
            <Field label="Skill tag" htmlFor="m-tag" error={errors.skillTag}>
              <input id="m-tag" className="input" list="skill-options" value={form.skillTag} onChange={(e) => setForm({ ...form, skillTag: e.target.value })} placeholder="e.g. Docker" />
              <datalist id="skill-options">{skills.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Due date" htmlFor="m-due" error={errors.dueDate}>
              <input id="m-due" type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
            <Field label="Status" htmlFor="m-status" error={errors.status}>
              <select id="m-status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MilestoneStatus })}>
                {COLUMNS.map((c) => <option key={c.status} value={c.status}>{c.title}</option>)}
              </select>
            </Field>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save milestone"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete milestone?"
          message={`"${deleting.title}" will be removed permanently.`}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}





