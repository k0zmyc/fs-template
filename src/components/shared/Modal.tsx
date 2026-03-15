"use client";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-950/80 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="font-semibold text-zinc-100">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
