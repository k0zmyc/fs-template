"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "⊞", exact: true },
  { href: "/dashboard/collections", label: "Collections", icon: "◫" },
  { href: "/dashboard/users", label: "Users", icon: "◎", adminOnly: true },
  { href: "/dashboard/audit", label: "Audit Log", icon: "◑", adminOnly: true },
];

export default function Sidebar({ user, role }: { user: any; role: string }) {
  const path = usePathname();
  const items = navItems.filter(i => !i.adminOnly || role === "ADMIN");
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col z-20">
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm">⚡</div>
          <span className="font-semibold text-sm text-zinc-100">AppTemplate</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(item => {
          const active = item.exact ? path === item.href : path.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"}`}>
              <span className="text-base">{item.icon}</span>{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-zinc-300 truncate">{user.name ?? user.email}</p>
          <p className="text-xs text-zinc-600 truncate">{user.email}</p>
          <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${role === "ADMIN" ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-500"}`}>{role}</span>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
          <span>↪</span> Sign out
        </button>
      </div>
    </aside>
  );
}
