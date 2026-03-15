import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isSelf = session?.user?.id === params.id;
  if (!isAdmin && !isSelf) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, password, role } = await req.json();
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (password) data.password = await bcrypt.hash(password, 12);
  if (role !== undefined && isAdmin) data.role = role;

  const user = await prisma.user.update({ where: { id: params.id }, data, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (session?.user?.id === params.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
