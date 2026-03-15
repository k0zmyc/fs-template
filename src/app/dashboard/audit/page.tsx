import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-400",
  UPDATE: "bg-blue-500/10 text-blue-400",
  DELETE: "bg-red-500/10 text-red-400",
  INVITE: "bg-indigo-500/10 text-indigo-400",
  REMOVE: "bg-amber-500/10 text-amber-400",
  LOGIN:  "bg-zinc-700/50 text-zinc-400",
};

export default async function AuditPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Last {logs.length} events across the system</p>
      </div>
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {logs.length === 0 && <p className="px-4 py-12 text-center text-zinc-600 text-sm">No events yet</p>}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Action</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Entity</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">By</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_STYLES[log.action] ?? "bg-zinc-700/50 text-zinc-400"}`}>{log.action}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-zinc-300 text-xs font-medium mr-1.5">{log.entityType}</span>
                  <span className="text-zinc-400 text-xs">{log.entityLabel ?? log.entityId.slice(0, 8)}</span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">{log.user.name ?? log.user.email}</td>
                <td className="px-4 py-3 text-zinc-600 text-xs hidden lg:table-cell">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
