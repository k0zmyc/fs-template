import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await can(session.user.id, (session.user as any).role, params.id, "manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { email, role } = await req.json();
  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const member = await prisma.collectionMember.upsert({
    where: { collectionId_userId: { collectionId: params.id, userId: targetUser.id } },
    update: { role },
    create: { collectionId: params.id, userId: targetUser.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  await audit({ action: "INVITE", entityType: "Member", entityId: member.id, entityLabel: targetUser.email, userId: session.user.id, collectionId: params.id });
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = await can(session.user.id, (session.user as any).role, params.id, "manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId } = await req.json();
  await prisma.collectionMember.delete({ where: { collectionId_userId: { collectionId: params.id, userId } } });
  await audit({ action: "REMOVE", entityType: "Member", entityId: userId, userId: session.user.id, collectionId: params.id });
  return NextResponse.json({ success: true });
}
