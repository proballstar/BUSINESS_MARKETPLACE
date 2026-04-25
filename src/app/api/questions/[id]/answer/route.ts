import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  const q = await prisma.question.findUnique({
    where: { id: params.id },
    include: { business: { select: { ownerId: true } } },
  });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (q.business.ownerId !== userId) return NextResponse.json({ error: "Only the owner can answer" }, { status: 403 });

  const { answer } = await req.json();
  if (!answer?.trim()) return NextResponse.json({ error: "Answer required" }, { status: 400 });

  const updated = await prisma.question.update({
    where: { id: params.id },
    data: { answer: answer.trim(), answeredAt: new Date() },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(updated);
}
