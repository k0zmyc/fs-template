import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar user={session.user} role={(session.user as any).role} />
      <main className="flex-1 ml-56 p-8">{children}</main>
    </div>
  );
}
