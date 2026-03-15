import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = (session.user as any).role === "ADMIN";
  const collections = isAdmin
    ? await prisma.collection.findMany({ include: { members: { include: { user: { select: { id: true, name: true, email: true } } } }, _count: { select: { records: true } } }, orderBy: { createdAt: "desc" } })
    : await prisma.collection.findMany({ where: { members: { some: { userId: session.user.id } } }, include: { members: { include: { user: { select: { id: true, name: true, email: true } } } }, _count: { select: { records: true } } }, orderBy: { createdAt: "desc" } });

  return NextResponse.json(collections);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, icon, coverImage, fieldSchema } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const col = await prisma.collection.create({
    data: { name, description, icon, coverImage, fieldSchema: fieldSchema ?? [],
      members: { create: { userId: session.user.id, role: "OWNER" } } },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } }, _count: { select: { records: true } } },
  });

  await audit({ action: "CREATE", entityType: "Collection", entityId: col.id, entityLabel: col.name, userId: session.user.id, collectionId: col.id });
  return NextResponse.json(col, { status: 201 });
}
