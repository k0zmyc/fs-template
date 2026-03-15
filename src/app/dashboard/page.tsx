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
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Welcome back, {session!.user!.name ?? session!.user!.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Collections" value={collectionCount} href="/dashboard/collections" />
        {isAdmin && <StatCard label="Users" value={userCount!} href="/dashboard/users" />}
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Recent activity</h2>
        <div className="rounded-xl border border-zinc-800 divide-y divide-zinc-800/60">
          {recentLogs.length === 0 && <p className="px-4 py-8 text-center text-zinc-600 text-sm">No activity yet</p>}
          {recentLogs.map(log => (
            <div key={log.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                  log.action === "CREATE" ? "bg-emerald-500/10 text-emerald-400" :
                  log.action === "DELETE" ? "bg-red-500/10 text-red-400" :
                  "bg-zinc-700/50 text-zinc-400"}`}>{log.action}</span>
                <span className="text-sm text-zinc-300">{log.entityLabel ?? log.entityId}</span>
                <span className="text-xs text-zinc-600 ml-2">{log.entityType}</span>
              </div>
              <div className="text-xs text-zinc-600">{new Date(log.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-4 hover:border-zinc-700 transition-colors block">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-3xl font-semibold mt-1 text-zinc-100">{value}</p>
    </Link>
  );
}
