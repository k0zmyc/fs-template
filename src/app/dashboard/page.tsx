import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const isAdmin = (session!.user as any).role === "ADMIN";

  const [collectionCount, userCount, recentLogs] = await Promise.all([
    prisma.collection.count({ where: isAdmin ? {} : { members: { some: { userId } } } }),
    isAdmin ? prisma.user.count() : Promise.resolve(null),
    prisma.auditLog.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-emerald-500/10 text-emerald-400",
    UPDATE: "bg-blue-500/10 text-blue-400",
    DELETE: "bg-red-500/10 text-red-400",
    INVITE: "bg-indigo-500/10 text-indigo-400",
    REMOVE: "bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Welcome back, {session!.user!.name ?? session!.user!.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/collections" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-4 hover:border-zinc-700 transition-colors">
          <p className="text-xs text-zinc-500">Collections</p>
          <p className="text-3xl font-semibold mt-1 text-zinc-100">{collectionCount}</p>
        </Link>
        {isAdmin && (
          <Link href="/dashboard/users" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-4 hover:border-zinc-700 transition-colors">
            <p className="text-xs text-zinc-500">Users</p>
            <p className="text-3xl font-semibold mt-1 text-zinc-100">{userCount}</p>
          </Link>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Recent activity</h2>
        <div className="rounded-xl border border-zinc-800 divide-y divide-zinc-800/60">
          {recentLogs.length === 0 && <p className="px-4 py-8 text-center text-zinc-600 text-sm">No activity yet</p>}
          {recentLogs.map(log => (
            <div key={log.id} className="px-4 py-3 flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2 min-w-0">
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-zinc-700/50 text-zinc-400"}`}>{log.action}</span>
                <div className="min-w-0">
                  <span className="text-sm text-zinc-300 truncate block">{log.entityLabel ?? log.entityId.slice(0, 12)}</span>
                  <span className="text-xs text-zinc-600">{log.entityType} · {log.user.name ?? log.user.email}</span>
                </div>
              </div>
              <span className="shrink-0 text-xs text-zinc-600 hidden sm:block">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
