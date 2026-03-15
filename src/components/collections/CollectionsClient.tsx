"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "@/components/shared/Modal";

const FIELD_TYPES = ["text", "number", "textarea", "select", "boolean", "date", "url"];
type FieldDef = { name: string; type: string; label: string; options?: string[] };
type Collection = {
  id: string; name: string; description?: string|null; icon?: string|null;
  coverImage?: string|null; fieldSchema: FieldDef[];
  _count: { records: number };
  members: { role: string; user: { id: string; name?: string|null; email: string } }[];
};
const emptyForm = { name: "", description: "", icon: "", coverImage: "", fieldSchema: [] as FieldDef[] };

export default function CollectionsClient({ initialCollections, userId, isAdmin }: {
  initialCollections: Collection[]; userId: string; isAdmin: boolean;
}) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newField, setNewField] = useState<FieldDef>({ name: "", type: "text", label: "" });

  const allSelected = collections.length > 0 && selected.size === collections.filter(c => {
    const m = c.members.find(m => m.user.id === userId);
    return m?.role === "OWNER" || isAdmin;
  }).length;

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const owned = collections.filter(c => {
      const m = c.members.find(m => m.user.id === userId);
      return m?.role === "OWNER" || isAdmin;
    }).map(c => c.id);
    if (selected.size === owned.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(owned));
    }
  }

  function addField() {
    if (!newField.name || !newField.label) { toast.error("Field name and label required"); return; }
    setForm(f => ({ ...f, fieldSchema: [...f.fieldSchema, { ...newField, options: newField.type === "select" ? (newField.options ?? []) : undefined }] }));
    setNewField({ name: "", type: "text", label: "" });
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const col = await res.json();
      setCollections(prev => [col, ...prev]);
      setShowModal(false); setForm(emptyForm);
      toast.success("Collection created");
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this collection and all its records?")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setCollections(prev => prev.filter(c => c.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    toast.success("Deleted");
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} collection(s) and all their records?`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map(id => fetch(`/api/collections/${id}`, { method: "DELETE" })));
      setCollections(prev => prev.filter(c => !selected.has(c.id)));
      setSelected(new Set());
      toast.success(`Deleted ${selected.size} collections`);
    } catch { toast.error("Some deletions failed"); } finally { setDeleting(false); }
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Collections</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              {deleting ? "Deleting…" : `Delete (${selected.size})`}
            </button>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            <span className="hidden sm:inline">New Collection</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {collections.length === 0 && (
        <div className="rounded-xl border border-zinc-800 py-16 text-center text-zinc-600 text-sm">
          No collections yet — create one
        </div>
      )}

      {collections.length > 0 && (
        <>
          {/* Select all bar */}
          <div className="flex items-center gap-3 px-1">
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
            <span className="text-xs text-zinc-500">
              {selected.size > 0 ? `${selected.size} selected` : "Select all owned"}
            </span>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map(col => {
              const myMember = col.members.find(m => m.user.id === userId);
              const role = myMember?.role ?? (isAdmin ? "OWNER" : "VIEWER");
              const canOwn = role === "OWNER" || isAdmin;
              const isSelected = selected.has(col.id);

              return (
                <div key={col.id}
                  className={`rounded-xl border bg-zinc-900 p-5 transition-all ${isSelected ? "border-indigo-500 ring-1 ring-indigo-500/50" : "border-zinc-800 hover:border-zinc-700"}`}>
                  {col.coverImage && (
                    <div className="h-24 rounded-lg mb-4 bg-cover bg-center" style={{ backgroundImage: `url(${col.coverImage})` }} />
                  )}
                  <div className="flex items-start gap-3">
                    {canOwn && (
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(col.id)}
                        className="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {col.icon && <span className="text-xl shrink-0">{col.icon}</span>}
                          <h3 className="font-medium text-zinc-100 truncate">{col.name}</h3>
                        </div>
                        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${
                          role === "OWNER" ? "bg-indigo-500/20 text-indigo-400" :
                          role === "EDITOR" ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-zinc-700/50 text-zinc-500"}`}>{role}</span>
                      </div>
                      {col.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{col.description}</p>}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-zinc-600">{col._count.records} records · {(col.fieldSchema as FieldDef[]).length} fields</span>
                        <div className="flex gap-2">
                          <button onClick={() => router.push(`/dashboard/collections/${col.id}`)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">Open</button>
                          {canOwn && (
                            <button onClick={() => handleDelete(col.id)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-900 transition-colors">Delete</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Collection" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div><label className="label">Icon</label><input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="input text-center" placeholder="🎬" /></div>
            <div className="col-span-3"><label className="label">Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="My Collection" /></div>
          </div>
          <div><label className="label">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input resize-none" /></div>
          <div><label className="label">Cover Image URL</label><input value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} className="input" placeholder="https://..." /></div>

          <div>
            <label className="label">Custom Fields</label>
            {form.fieldSchema.length > 0 && (
              <div className="space-y-1 mb-3">
                {form.fieldSchema.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800 text-xs">
                    <span className="text-zinc-300">{f.label} <span className="text-zinc-500">({f.name}, {f.type})</span></span>
                    <button onClick={() => setForm(f2 => ({...f2, fieldSchema: f2.fieldSchema.filter((_,j) => j !== i)}))}
                      className="text-red-500 hover:text-red-400 ml-2">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-5 gap-2">
              <input placeholder="key" value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})} className="input text-xs" />
              <input placeholder="Label" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} className="input text-xs col-span-2" />
              <select value={newField.type} onChange={e => setNewField({...newField, type: e.target.value})} className="input text-xs">
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={addField} className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg transition-colors">+ Add</button>
            </div>
            {newField.type === "select" && (
              <input placeholder="Options comma separated: Low, Medium, High" value={newField.options?.join(", ") ?? ""}
                onChange={e => setNewField({...newField, options: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
                className="input text-xs mt-2" />
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
