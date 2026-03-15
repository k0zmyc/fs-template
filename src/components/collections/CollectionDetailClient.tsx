"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "@/components/shared/Modal";
import Link from "next/link";

type FieldDef = { name: string; type: string; label: string; options?: string[] };
type Member = { id: string; role: string; userId: string; user: { id: string; name?: string|null; email: string; role?: string } };
type Record_ = { id: string; title: string; imageUrl?: string|null; data: Record<string,unknown>; createdAt: string; createdBy: { name?: string|null; email: string } };
type Collection = { id: string; name: string; description?: string|null; icon?: string|null; fieldSchema: FieldDef[]; members: Member[] };
type Tab = "records" | "members";
const ROLES = ["VIEWER", "EDITOR", "OWNER"] as const;
const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30",
  EDITOR: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
  VIEWER: "bg-zinc-700/50 text-zinc-400 ring-1 ring-zinc-600/30",
};

function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  if (field.type === "boolean") return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <div className={`relative w-10 h-6 rounded-full transition-colors ${value ? "bg-indigo-600" : "bg-zinc-700"}`} onClick={() => onChange(!value)}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
      </div>
      <span className="text-sm text-zinc-300">{field.label}</span>
    </label>
  );
  if (field.type === "select") return (
    <select value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} className="input">
      <option value="">— select —</option>
      {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (field.type === "textarea") return (
    <textarea rows={3} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} className="input resize-none" />
  );
  return <input
    type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
    value={(value as string) ?? ""}
    onChange={e => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
    className="input" />;
}

export default function CollectionDetailClient({ collection, initialRecords, allUsers, myRole, canEdit, canManage, userId }: {
  collection: Collection; initialRecords: Record_[]; allUsers: { id: string; name?: string|null; email: string }[];
  myRole: string; canEdit: boolean; canManage: boolean; userId: string;
}) {
  const router = useRouter();
  const fields = collection.fieldSchema as FieldDef[];
  const [tab, setTab] = useState<Tab>("records");
  const [records, setRecords] = useState<Record_[]>(initialRecords);
  const [members, setMembers] = useState<Member[]>(collection.members);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [recordModal, setRecordModal] = useState(false);
  const [editRecord, setEditRecord] = useState<Record_|null>(null);
  const [recForm, setRecForm] = useState<{ title: string; imageUrl: string; data: Record<string,unknown> }>({ title: "", imageUrl: "", data: {} });
  const [savingRec, setSavingRec] = useState(false);

  const [memberModal, setMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"VIEWER"|"EDITOR"|"OWNER">("VIEWER");
  const [savingMember, setSavingMember] = useState(false);

  const [settingsModal, setSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: collection.name, description: collection.description ?? "", icon: collection.icon ?? "", coverImage: "" });
  const [savingSettings, setSavingSettings] = useState(false);

  const allSelected = records.length > 0 && selected.size === records.length;

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(records.map(r => r.id)));
  }

  function openCreate() {
    setEditRecord(null);
    setRecForm({ title: "", imageUrl: "", data: Object.fromEntries(fields.map(f => [f.name, f.type === "boolean" ? false : ""])) });
    setRecordModal(true);
  }
  function openEdit(r: Record_) {
    setEditRecord(r);
    setRecForm({ title: r.title, imageUrl: r.imageUrl ?? "", data: { ...r.data } });
    setRecordModal(true);
  }

  async function saveRecord() {
    if (!recForm.title.trim()) { toast.error("Title required"); return; }
    setSavingRec(true);
    try {
      if (editRecord) {
        const res = await fetch(`/api/collections/${collection.id}/records/${editRecord.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recForm) });
        const updated = await res.json();
        setRecords(prev => prev.map(r => r.id === editRecord.id ? updated : r));
        toast.success("Updated");
      } else {
        const res = await fetch(`/api/collections/${collection.id}/records`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recForm) });
        const created = await res.json();
        setRecords(prev => [created, ...prev]);
        toast.success("Created");
      }
      setRecordModal(false);
    } catch { toast.error("Failed"); } finally { setSavingRec(false); }
  }

  async function deleteRecord(id: string) {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/collections/${collection.id}/records/${id}`, { method: "DELETE" });
    setRecords(prev => prev.filter(r => r.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    toast.success("Deleted");
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} record(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map(id => fetch(`/api/collections/${collection.id}/records/${id}`, { method: "DELETE" })));
      setRecords(prev => prev.filter(r => !selected.has(r.id)));
      setSelected(new Set());
      toast.success(`Deleted ${selected.size} records`);
    } catch { toast.error("Some deletions failed"); } finally { setBulkDeleting(false); }
  }

  async function saveMember() {
    if (!memberEmail) { toast.error("Email required"); return; }
    setSavingMember(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: memberEmail, role: memberRole }) });
      if (!res.ok) { const e = await res.json(); toast.error(e.error); return; }
      const m = await res.json();
      setMembers(prev => { const idx = prev.findIndex(x => x.userId === m.userId); return idx >= 0 ? prev.map((x,i) => i === idx ? m : x) : [...prev, m]; });
      setMemberModal(false); setMemberEmail(""); setMemberRole("VIEWER");
      toast.success("Member saved");
    } catch { toast.error("Failed"); } finally { setSavingMember(false); }
  }

  async function removeMember(uid: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/collections/${collection.id}/members`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: uid }) });
    setMembers(prev => prev.filter(m => m.userId !== uid));
    toast.success("Removed");
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await fetch(`/api/collections/${collection.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsForm) });
      toast.success("Saved"); setSettingsModal(false); router.refresh();
    } catch { toast.error("Failed"); } finally { setSavingSettings(false); }
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/collections" className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            {collection.icon && <span className="text-2xl shrink-0">{collection.icon}</span>}
            <h1 className="text-xl font-semibold truncate">{collection.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canManage && (
            <button onClick={() => setSettingsModal(true)} className="p-2 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          )}
          {canEdit && tab === "records" && selected.size > 0 && (
            <button onClick={bulkDelete} disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              {bulkDeleting ? "Deleting…" : `Delete (${selected.size})`}
            </button>
          )}
          {canEdit && tab === "records" && (
            <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              <span className="hidden sm:inline">New Record</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
          {canManage && tab === "members" && (
            <button onClick={() => setMemberModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              <span className="hidden sm:inline">Add Member</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(["records", "members"] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setSelected(new Set()); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${tab === t ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
            {t} {t === "records" ? `(${records.length})` : `(${members.length})`}
          </button>
        ))}
      </div>

      {/* ── Records ──────────────────────────────────── */}
      {tab === "records" && (
        <div>
          {records.length === 0 && (
            <div className="rounded-xl border border-zinc-800 py-16 text-center text-zinc-600 text-sm">
              No records yet{canEdit && <> — <button onClick={openCreate} className="text-indigo-400 hover:underline">create one</button></>}
            </div>
          )}

          {records.length > 0 && canEdit && (
            <div className="flex items-center gap-3 px-1 mb-3">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
              <span className="text-xs text-zinc-500">{selected.size > 0 ? `${selected.size} selected` : "Select all"}</span>
            </div>
          )}

          {/* Mobile cards */}
          {records.length > 0 && (
            <>
              <div className="sm:hidden space-y-2">
                {records.map(rec => (
                  <div key={rec.id} className={`rounded-xl border bg-zinc-900/50 p-4 transition-all ${selected.has(rec.id) ? "border-indigo-500 ring-1 ring-indigo-500/30" : "border-zinc-800"}`}>
                    <div className="flex items-start gap-3">
                      {canEdit && (
                        <input type="checkbox" checked={selected.has(rec.id)} onChange={() => toggleSelect(rec.id)}
                          className="mt-1 w-4 h-4 rounded accent-indigo-500 cursor-pointer shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {rec.imageUrl && <img src={rec.imageUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" onError={e => (e.currentTarget.style.display="none")} />}
                            <p className="font-medium text-zinc-100 truncate">{rec.title}</p>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => openEdit(rec)} className="text-xs text-zinc-400 px-2.5 py-1.5 rounded-lg border border-zinc-700 transition-colors">Edit</button>
                              <button onClick={() => deleteRecord(rec.id)} className="text-xs text-red-500 px-2.5 py-1.5 rounded-lg border border-red-900/40 transition-colors">Del</button>
                            </div>
                          )}
                        </div>
                        {fields.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                            {fields.slice(0, 4).map(f => (
                              <div key={f.name}>
                                <p className="text-xs text-zinc-600">{f.label}</p>
                                <p className="text-xs text-zinc-300 truncate">{f.type === "boolean" ? ((rec.data as any)[f.name] ? "✓ Yes" : "✗ No") : String((rec.data as any)[f.name] ?? "—")}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-zinc-600 mt-2">{new Date(rec.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      {canEdit && (
                        <th className="px-4 py-3 w-10">
                          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                        </th>
                      )}
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
                      {fields.slice(0, 3).map(f => <th key={f.name} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{f.label}</th>)}
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {records.map(rec => (
                      <tr key={rec.id} className={`transition-colors group ${selected.has(rec.id) ? "bg-indigo-950/30" : "hover:bg-zinc-900/40"}`}>
                        {canEdit && (
                          <td className="px-4 py-3.5">
                            <input type="checkbox" checked={selected.has(rec.id)} onChange={() => toggleSelect(rec.id)} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                          </td>
                        )}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {rec.imageUrl && <img src={rec.imageUrl} alt="" className="w-7 h-7 rounded object-cover" onError={e => (e.currentTarget.style.display="none")} />}
                            <span className="font-medium text-zinc-100">{rec.title}</span>
                          </div>
                        </td>
                        {fields.slice(0, 3).map(f => (
                          <td key={f.name} className="px-4 py-3.5 text-zinc-400 max-w-xs truncate">
                            {f.type === "boolean" ? ((rec.data as any)[f.name] ? "✓" : "—") : String((rec.data as any)[f.name] ?? "—")}
                          </td>
                        ))}
                        <td className="px-4 py-3.5 text-zinc-600 text-xs">{new Date(rec.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3.5">
                          {canEdit && (
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(rec)} className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-md border border-zinc-800 hover:border-zinc-700 transition-colors">Edit</button>
                              <button onClick={() => deleteRecord(rec.id)} className="text-xs text-red-500 hover:text-red-400 px-2.5 py-1 rounded-md border border-red-900/40 hover:border-red-900 transition-colors">Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Members ──────────────────────────────────── */}
      {tab === "members" && (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors">
              <div className="min-w-0">
                <p className="font-medium text-zinc-100 truncate">{m.user.name ?? m.user.email}</p>
                <p className="text-xs text-zinc-500 truncate">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[m.role] ?? ROLE_BADGE.VIEWER}`}>{m.role}</span>
                {canManage && m.userId !== userId && (
                  <div className="flex gap-1.5">
                    <button onClick={() => { setMemberEmail(m.user.email); setMemberRole(m.role as any); setMemberModal(true); }} className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-700 transition-colors">Edit</button>
                    <button onClick={() => removeMember(m.userId)} className="text-xs text-red-500 px-2.5 py-1.5 rounded-lg border border-red-900/40 transition-colors">Remove</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Modal */}
      <Modal open={recordModal} onClose={() => setRecordModal(false)} title={editRecord ? "Edit Record" : "New Record"} wide>
        <div className="space-y-4">
          <div><label className="label">Title *</label><input value={recForm.title} onChange={e => setRecForm({...recForm, title: e.target.value})} className="input" /></div>
          <div><label className="label">Image URL</label><input value={recForm.imageUrl} onChange={e => setRecForm({...recForm, imageUrl: e.target.value})} className="input" placeholder="https://..." /></div>
          {fields.map(f => (
            <div key={f.name}>
              {f.type !== "boolean" && <label className="label">{f.label}</label>}
              <FieldInput field={f} value={recForm.data[f.name]} onChange={v => setRecForm(prev => ({...prev, data: {...prev.data, [f.name]: v}}))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button onClick={() => setRecordModal(false)} className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          <button onClick={saveRecord} disabled={savingRec} className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">{savingRec ? "Saving…" : editRecord ? "Save" : "Create"}</button>
        </div>
      </Modal>

      {/* Member Modal */}
      <Modal open={memberModal} onClose={() => setMemberModal(false)} title="Add / Update Member">
        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)} className="input" placeholder="user@example.com" list="users-list" />
            <datalist id="users-list">{allUsers.map(u => <option key={u.id} value={u.email} />)}</datalist>
          </div>
          <div>
            <label className="label">Role</label>
            <select value={memberRole} onChange={e => setMemberRole(e.target.value as any)} className="input">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button onClick={() => setMemberModal(false)} className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          <button onClick={saveMember} disabled={savingMember} className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">{savingMember ? "Saving…" : "Save"}</button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={settingsModal} onClose={() => setSettingsModal(false)} title="Collection Settings">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div><label className="label">Icon</label><input value={settingsForm.icon} onChange={e => setSettingsForm({...settingsForm, icon: e.target.value})} className="input text-center" placeholder="🎬" /></div>
            <div className="col-span-3"><label className="label">Name</label><input value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className="input" /></div>
          </div>
          <div><label className="label">Description</label><textarea rows={2} value={settingsForm.description} onChange={e => setSettingsForm({...settingsForm, description: e.target.value})} className="input resize-none" /></div>
          <div><label className="label">Cover Image URL</label><input value={settingsForm.coverImage} onChange={e => setSettingsForm({...settingsForm, coverImage: e.target.value})} className="input" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button onClick={() => setSettingsModal(false)} className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          <button onClick={saveSettings} disabled={savingSettings} className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">{savingSettings ? "Saving…" : "Save"}</button>
        </div>
      </Modal>
    </div>
  );
}
