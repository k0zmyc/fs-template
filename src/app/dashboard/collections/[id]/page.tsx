import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { notFound } from "next/navigation";
import CollectionDetailClient from "@/components/collections/CollectionDetailClient";

export default async function CollectionPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const globalRole = (session!.user as any).role;

  const allowed = await can(userId, globalRole, params.id, "view");
  if (!allowed) notFound();

  const [col, records, allUsers] = await Promise.all([
    prisma.collection.findUnique({
      where: { id: params.id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
    }),
    prisma.record.findMany({
      where: { collectionId: params.id },
      include: { createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    globalRole === "ADMIN"
      ? prisma.user.findMany({ select: { id: true, name: true, email: true } })
      : Promise.resolve([]),
  ]);

  if (!col) notFound();

  const myRole = col.members.find(m => m.userId === userId)?.role ?? (globalRole === "ADMIN" ? "OWNER" : "VIEWER");
  const canEdit = myRole === "OWNER" || myRole === "EDITOR" || globalRole === "ADMIN";
  const canManage = myRole === "OWNER" || globalRole === "ADMIN";

  // Cast JSON fields to plain objects for client component
  const safeCol = {
    ...col,
    fieldSchema: (col.fieldSchema ?? []) as any[],
    members: col.members.map(m => ({ ...m, user: { ...m.user, role: String(m.user.role) } })),
  };

  const safeRecords = records.map(r => ({
    ...r,
    data: (r.data ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <CollectionDetailClient
      collection={safeCol}
      initialRecords={safeRecords}
      allUsers={allUsers}
      myRole={myRole}
      canEdit={canEdit}
      canManage={canManage}
      userId={userId}
    />
  );
}
