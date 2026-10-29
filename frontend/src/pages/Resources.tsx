import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, parseError } from "../api/client";
import Field from "../components/Field";
import { PageHeader } from "../components/Layout";
import Modal, { ConfirmDialog } from "../components/Modal";
import { useToast } from "../components/Toast";
import { formatDate,tagClass } from "../lib/format";
import type { Resource, ResourceType } from "../types";

const TYPES: { value: ResourceType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Videos" },
  { value: "article", label: "Articles" },
  { value: "documentation", label: "Documentation" },
  { value: "certification", label: "Certifications" },
];
const TYPE_LABEL: Record<ResourceType, string> = { video: "Video", article: "Article", documentation: "Documentation", certification: "Certification" };

interface FormState { title: string; url: string; type: ResourceType; skillTag: string }
const EMPTY: FormState = { title: "", url: "", type: "video", skillTag: "" };

const host = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

export default function Resources() {
  const { notify } = useToast();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ResourceType | "all">("all");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState<Resource | "new" | null>(null);
  const [deleting, setDeleting] = useState<Resource | null>(null);
  const [viewing, setViewing] = useState<Resource | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

     useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Resource[]>("/resources", { params: { q: query || undefined, type, sort } });
      setItems(data);
    } catch (e) {
      notify("error", parseError(e).message);
    } finally {
      setLoading(false);
    }
  }, [query, type, sort, notify]);

  useEffect(() => { load(); }, [load]);

  function openForm(target: Resource | "new") {
    setErrors({});
    setForm(target === "new" ? EMPTY : { title: target.title, url: target.url, type: target.type, skillTag: target.skillTag });
    setEditing(target);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (form.title.trim().length < 3) local.title = "Title must be at least 3 characters";
    if (!/^https?:\/\/\S+\.\S+/i.test(form.url.trim())) local.url = "Enter a full link, e.g. https://example.com";
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      if (editing === "new") {
        await api.post("/resources", form);
        notify("success", "Resource added");
      } else if (editing) {
        await api.put(`/resources/${editing.id}`, form);
        notify("success", "Resource updated");
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

  async function remove() {
    if (!deleting) return;
    try {
      await api.delete(`/resources/${deleting.id}`);
      notify("success", "Resource deleted");
      setDeleting(null);
      await load();
    } catch (err) {
      notify("error", parseError(err).message);
    }
  }

  async function view(id: string) {
    try {
      const { data } = await api.get<Resource>(`/resources/${id}`);
      setViewing(data);
    } catch (err) {
      notify("error", parseError(err).message);
    }
  }

  return (
    <>
      <PageHeader title="Resource Hub" subtitle="Your saved learning links." />
      <div className="toolbar">
        <input className="input" type="search" placeholder="Search resources" aria-label="Search resources" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn" onClick={() => openForm("new")}>+ Add Resource</button>
      </div>

      <div className="chips">
        {TYPES.map((t) => (
          <button key={t.value} className={`filter${type === t.value ? " active" : ""}`} aria-pressed={type === t.value} onClick={() => setType(t.value)}>
            {t.label}
          </button>
        ))}
        <select className="input sort-select" aria-label="Sort resources" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Loading resources…</p>
      ) : items.length === 0 ? (
        <p className="empty">{query || type !== "all" ? "No resources match your search or filter." : "No saved links yet. Add your first resource to start your library."}</p>
      ) : (
        <div className="res-grid">
          {items.map((r) => (
            <article className="card rcard" key={r.id}>
              {r.skillTag && <span className={tagClass(r.skillTag)}>#{r.skillTag}</span>}
              <h3>{r.title}</h3>
              <p className="meta">{host(r.url)} · {TYPE_LABEL[r.type]}</p>
              <div className="actions">
                <a className="btn btn-sm" href={r.url} target="_blank" rel="noopener noreferrer">Open link</a>
                <button className="btn btn-ghost btn-sm" onClick={() => view(r.id)}>View</button>
                <button className="btn btn-ghost btn-sm" onClick={() => openForm(r)}>Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => setDeleting(r)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === "new" ? "Add resource" : "Edit resource"} onClose={() => setEditing(null)}>
          <form onSubmit={save} noValidate>
            <Field label="Title" htmlFor="r-title" error={errors.title}>
              <input id="r-title" className={`input${errors.title ? " invalid" : ""}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
            </Field>
            <Field label="Link" htmlFor="r-url" error={errors.url}>
              <input id="r-url" type="url" className={`input${errors.url ? " invalid" : ""}`} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="Type" htmlFor="r-type" error={errors.type}>
              <select id="r-type" className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}>
                {TYPES.filter((t) => t.value !== "all").map((t) => <option key={t.value} value={t.value}>{TYPE_LABEL[t.value as ResourceType]}</option>)}
              </select>
            </Field>
            <Field label="Skill tag" htmlFor="r-tag" error={errors.skillTag}>
              <input id="r-tag" className="input" value={form.skillTag} onChange={(e) => setForm({ ...form, skillTag: e.target.value })} placeholder="e.g. React" />
            </Field>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save resource"}</button>
            </div>
          </form>
        </Modal>
      )}


      {viewing && (
        <Modal title="Resource details" onClose={() => setViewing(null)}>
          <dl className="details">
            <dt>Title</dt><dd>{viewing.title}</dd>
            <dt>Type</dt><dd>{TYPE_LABEL[viewing.type]}</dd>
            <dt>Skill tag</dt><dd>{viewing.skillTag || "None"}</dd>
            <dt>Link</dt><dd><a href={viewing.url} target="_blank" rel="noopener noreferrer">{viewing.url}</a></dd>
            <dt>Added</dt><dd>{viewing.createdAt ? formatDate(viewing.createdAt) : "-"}</dd>
          </dl>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setViewing(null)}>Close</button>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog title="Delete resource?" message={`"${deleting.title}" will be removed from your library.`} onConfirm={remove} onClose={() => setDeleting(null)} />
      )}
    </>
  );
}