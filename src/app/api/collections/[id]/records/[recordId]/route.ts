import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: { id: string; recordId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await can(session.user.id, (session.user as any).role, params.id, "edit");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const before = await prisma.record.findUnique({ where: { id: params.recordId } });
  const { title, imageUrl, data } = await req.json();
  const updated = await prisma.record.update({
    where: { id: params.recordId },
    data: { title, imageUrl, data },
    include: { createdBy: { select: { name: true, email: true } } },
  });
  await audit({ action: "UPDATE", entityType: "Record", entityId: params.recordId, entityLabel: title, diff: { before, after: updated }, userId: session.user.id, collectionId: params.id, recordId: params.recordId });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; recordId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await can(session.user.id, (session.user as any).role, params.id, "edit");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const record = await prisma.record.findUnique({ where: { id: params.recordId } });
  await prisma.record.delete({ where: { id: params.recordId } });
  await audit({ action: "DELETE", entityType: "Record", entityId: params.recordId, entityLabel: record?.title, userId: session.user.id, collectionId: params.id });
  return NextResponse.json({ success: true });
}
