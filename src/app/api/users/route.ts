import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, email, password, role } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, password: hashed, role: role ?? "USER" }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return NextResponse.json(user, { status: 201 });
}
