import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar user={session.user} role={(session.user as any).role} />
      {/* Desktop: offset for sidebar. Mobile: offset for top bar + bottom tab bar */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 pb-20 md:pb-0 p-4 md:p-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
