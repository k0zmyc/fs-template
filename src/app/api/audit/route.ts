import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = (session.user as any).role === "ADMIN";
  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("collectionId");

  const logs = await prisma.auditLog.findMany({
    where: isAdmin
      ? collectionId ? { collectionId } : {}
      : { OR: [{ userId: session.user.id }, { collection: { members: { some: { userId: session.user.id, role: { in: ["OWNER"] } } } } }] },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(logs);
}
