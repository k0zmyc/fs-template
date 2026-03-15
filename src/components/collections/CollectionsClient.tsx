"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "@/components/shared/Modal";

const FIELD_TYPES = ["text", "number", "textarea", "select", "boolean", "date", "url"];

type FieldDef = { name: string; type: string; label: string; options?: string[] };
type Collection = { id: string; name: string; description?: string|null; icon?: string|null; coverImage?: string|null; fieldSchema: FieldDef[]; _count: { records: number }; members: { role: string; user: { id: string; name?: string|null; email: string } }[] };

const emptyForm = { name: "", description: "", icon: "", coverImage: "", fieldSchema: [] as FieldDef[] };

export default function CollectionsClient({ initialCollections, userId, isAdmin }: { initialCollections: Collection[]; userId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState<FieldDef>({ name: "", type: "text", label: "" });

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
    toast.success("Deleted");
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Collections</h1><p className="text-sm text-zinc-500 mt-0.5">{collections.length} collection{collections.length !== 1 ? "s" : ""}</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">+ New</button>
      </div>

      {collections.length === 0 && <div className="rounded-xl border border-zinc-800 py-16 text-center text-zinc-600 text-sm">No collections yet — create one</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map(col => {
          const myMember = col.members.find(m => m.user.id === userId);
          const role = myMember?.role ?? (isAdmin ? "OWNER" : "VIEWER");
          return (
            <div key={col.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors group">
              {col.coverImage && <div className="h-24 rounded-lg mb-4 bg-cover bg-center" style={{ backgroundImage: `url(${col.coverImage})` }} />}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {col.icon && <span className="text-2xl">{col.icon}</span>}
                  <div>
                    <h3 className="font-medium text-zinc-100 leading-tight">{col.name}</h3>
                    {col.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{col.description}</p>}
                  </div>
                </div>
                <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${role === "OWNER" ? "bg-indigo-500/20 text-indigo-400" : role === "EDITOR" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-700/50 text-zinc-500"}`}>{role}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-zinc-600">{col._count.records} record{col._count.records !== 1 ? "s" : ""} · {(col.fieldSchema as FieldDef[]).length} fields</span>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/dashboard/collections/${col.id}`)} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">Open</button>
                  {(role === "OWNER" || isAdmin) && <button onClick={() => handleDelete(col.id)} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-900 transition-colors">Delete</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Collection">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div><label className="label">Icon</label><input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="input" placeholder="🎬" /></div>
            <div className="col-span-3"><label className="label">Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="My Collection" /></div>
          </div>
          <div><label className="label">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input resize-none" /></div>
          <div><label className="label">Cover Image URL</label><input value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} className="input" placeholder="https://..." /></div>

          <div>
            <div className="flex items-center justify-between mb-2"><label className="label mb-0">Fields</label></div>
            {form.fieldSchema.length > 0 && (
              <div className="space-y-1 mb-3">
                {form.fieldSchema.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-800 text-xs">
                    <span className="text-zinc-300">{f.label} <span className="text-zinc-500">({f.name})</span></span>
                    <span className="flex items-center gap-2"><span className="text-zinc-500">{f.type}</span>
                      <button onClick={() => setForm(f2 => ({...f2, fieldSchema: f2.fieldSchema.filter((_,j) => j !== i)}))} className="text-red-500 hover:text-red-400">×</button></span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-5 gap-2">
              <input placeholder="name" value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})} className="input text-xs col-span-1" />
              <input placeholder="label" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} className="input text-xs col-span-2" />
              <select value={newField.type} onChange={e => setNewField({...newField, type: e.target.value})} className="input text-xs">
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={addField} className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg transition-colors">Add</button>
            </div>
            {newField.type === "select" && (
              <input placeholder="Options (comma separated)" value={newField.options?.join(",") ?? ""} onChange={e => setNewField({...newField, options: e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} className="input text-xs mt-2" />
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">{saving ? "Creating…" : "Create"}</button>
        </div>
      </Modal>
    </div>
  );
}
