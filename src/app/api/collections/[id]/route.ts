import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await can(session.user.id, (session.user as any).role, params.id, "view");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const col = await prisma.collection.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } }, _count: { select: { records: true } } },
  });
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(col);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await can(session.user.id, (session.user as any).role, params.id, "manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const before = await prisma.collection.findUnique({ where: { id: params.id } });
  const { name, description, icon, coverImage, fieldSchema } = await req.json();
  const updated = await prisma.collection.update({
    where: { id: params.id },
    data: { name, description, icon, coverImage, ...(fieldSchema !== undefined && { fieldSchema }) },
    include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } }, _count: { select: { records: true } } },
  });
  await audit({ action: "UPDATE", entityType: "Collection", entityId: params.id, entityLabel: updated.name, diff: { before, after: updated }, userId: session.user.id, collectionId: params.id });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await can(session.user.id, (session.user as any).role, params.id, "manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const col = await prisma.collection.findUnique({ where: { id: params.id } });
  await prisma.collection.delete({ where: { id: params.id } });
  await audit({ action: "DELETE", entityType: "Collection", entityId: params.id, entityLabel: col?.name, userId: session.user.id });
  return NextResponse.json({ success: true });
}
