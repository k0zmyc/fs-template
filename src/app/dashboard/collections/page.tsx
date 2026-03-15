import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CollectionsClient from "@/components/collections/CollectionsClient";

export default async function CollectionsPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const isAdmin = (session!.user as any).role === "ADMIN";

  const collections = await prisma.collection.findMany({
    where: isAdmin ? {} : { members: { some: { userId } } },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } }, _count: { select: { records: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <CollectionsClient initialCollections={collections} userId={userId} isAdmin={isAdmin} />;
}
