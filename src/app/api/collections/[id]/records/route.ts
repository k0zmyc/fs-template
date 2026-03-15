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
  const records = await prisma.record.findMany({
    where: { collectionId: params.id },
    include: { createdBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await can(session.user.id, (session.user as any).role, params.id, "edit");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, imageUrl, data } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const record = await prisma.record.create({
    data: { collectionId: params.id, title, imageUrl, data: data ?? {}, createdById: session.user.id },
    include: { createdBy: { select: { name: true, email: true } } },
  });
  await audit({ action: "CREATE", entityType: "Record", entityId: record.id, entityLabel: title, userId: session.user.id, collectionId: params.id, recordId: record.id });
  return NextResponse.json(record, { status: 201 });
}
