"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "⊞", mobileIcon: "⊞", exact: true },
  { href: "/dashboard/collections", label: "Collections", icon: "◫", mobileIcon: "◫" },
  { href: "/dashboard/users", label: "Users", icon: "◎", mobileIcon: "◎", adminOnly: true },
  { href: "/dashboard/audit", label: "Audit Log", icon: "◑", mobileIcon: "◑", adminOnly: true },
];

export default function Sidebar({ user, role }: { user: any; role: string }) {
  const path = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = navItems.filter(i => !i.adminOnly || role === "ADMIN");

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [path]);

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#mobile-drawer") && !target.closest("#drawer-toggle")) setDrawerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  const isActive = (item: typeof navItems[0]) => item.exact ? path === item.href : path.startsWith(item.href);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {items.map(item => (
        <Link key={item.href} href={item.href} onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive(item) ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          }`}>
          <span className="text-lg w-5 text-center leading-none">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-zinc-900 border-r border-zinc-800 flex-col z-20">
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm">⚡</div>
            <span className="font-semibold text-sm text-zinc-100">AppTemplate</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavLinks />
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

      {/* ── Mobile top bar ───────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm">⚡</div>
          <span className="font-semibold text-sm text-zinc-100">AppTemplate</span>
        </div>
        <button id="drawer-toggle" onClick={() => setDrawerOpen(v => !v)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
          {drawerOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </header>

      {/* ── Mobile drawer overlay ────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Mobile drawer ────────────────────────────────── */}
      <div id="mobile-drawer"
        className={`md:hidden fixed top-14 left-0 bottom-0 w-72 z-30 bg-zinc-900 border-r border-zinc-800 flex flex-col transform transition-transform duration-200 ease-out ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLinks onClick={() => setDrawerOpen(false)} />
        </nav>
        <div className="px-3 py-4 border-t border-zinc-800">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-zinc-200 truncate">{user.name ?? user.email}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full ${role === "ADMIN" ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-500"}`}>{role}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-3 py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <span>↪</span> Sign out
          </button>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 flex">
        {items.slice(0, 4).map(item => {
          const active = isActive(item);
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${active ? "text-indigo-400" : "text-zinc-500"}`}>
              <span className={`text-xl leading-none ${active ? "text-indigo-400" : "text-zinc-500"}`}>{item.mobileIcon}</span>
              <span className="text-[10px] leading-tight">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
