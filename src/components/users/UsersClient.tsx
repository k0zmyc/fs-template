"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/shared/Modal";

type User = { id: string; name?: string|null; email: string; role: string; createdAt: string };
const GLOBAL_ROLES = ["USER", "ADMIN"] as const;
const emptyForm = { name: "", email: "", password: "", role: "USER" as "USER"|"ADMIN" };

export default function UsersClient({ initialUsers, currentUserId }: { initialUsers: User[]; currentUserId: string }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [createModal, setCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<User|null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "", role: "USER" as "USER"|"ADMIN" });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!form.email || !form.password) { toast.error("Email and password required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); toast.error(e.error); return; }
      const user = await res.json();
      setUsers(prev => [user, ...prev]);
      setCreateModal(false); setForm(emptyForm);
      toast.success("User created");
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  }

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ name: u.name ?? "", email: u.email, password: "", role: u.role as any });
  }

  async function handleEdit() {
    if (!editUser) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { name: editForm.name, email: editForm.email, role: editForm.role };
      if (editForm.password) body.password = editForm.password;
      const res = await fetch(`/api/users/${editUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json(); toast.error(e.error); return; }
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u));
      setEditUser(null); toast.success("User updated");
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) { const e = await res.json(); toast.error(e.error); return; }
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success("Deleted");
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          <span className="hidden sm:inline">New User</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-2">
        {users.map(u => (
          <div key={u.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-zinc-100 truncate">{u.name ?? "—"}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30" : "bg-zinc-700/50 text-zinc-400 ring-1 ring-zinc-600/30"}`}>{u.role}</span>
                  <span className="text-xs text-zinc-600">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => openEdit(u)} className="text-xs text-zinc-400 px-2.5 py-1.5 rounded-lg border border-zinc-700 transition-colors">Edit</button>
                {u.id !== currentUserId && <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 px-2.5 py-1.5 rounded-lg border border-red-900/40 transition-colors">Del</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">User</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Role</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Joined</th>
            <th className="px-4 py-3" />
          </tr></thead>
          <tbody className="divide-y divide-zinc-800/60">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors group">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-zinc-100">{u.name ?? "—"}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30" : "bg-zinc-700/50 text-zinc-400 ring-1 ring-zinc-600/30"}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3.5 text-zinc-600 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(u)} className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-md border border-zinc-800 hover:border-zinc-700 transition-colors">Edit</button>
                    {u.id !== currentUserId && <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:text-red-400 px-2.5 py-1 rounded-md border border-red-900/40 hover:border-red-900 transition-colors">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="New User">
        <div className="space-y-4">
          <div><label className="label">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Jane Doe" /></div>
          <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" /></div>
          <div><label className="label">Password *</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" /></div>
          <div><label className="label">Global Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value as any})} className="input">
              {GLOBAL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button onClick={() => setCreateModal(false)} className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">{saving ? "Creating…" : "Create"}</button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <div className="space-y-4">
          <div><label className="label">Name</label><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input" /></div>
          <div><label className="label">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="input" /></div>
          <div><label className="label">New Password <span className="text-zinc-600 text-xs">(blank = keep)</span></label><input type="password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} className="input" /></div>
          <div><label className="label">Global Role</label>
            <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value as any})} className="input">
              {GLOBAL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button onClick={() => setEditUser(null)} className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          <button onClick={handleEdit} disabled={saving} className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">{saving ? "Saving…" : "Save"}</button>
        </div>
      </Modal>
    </div>
  );
}
