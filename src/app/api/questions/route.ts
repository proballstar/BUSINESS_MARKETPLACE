import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const questions = await prisma.question.findMany({
    where: { businessId },
    include: { user: { select: { name: true } } },
    orderBy: [{ answer: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in to ask a question" }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  const { businessId, question } = await req.json();
  if (!businessId || !question?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const q = await prisma.question.create({
    data: { businessId, userId, question: question.trim() },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(q, { status: 201 });
}
