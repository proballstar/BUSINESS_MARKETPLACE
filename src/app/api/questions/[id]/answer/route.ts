import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { answerSchema, parseBody } from "@/lib/validation";
import { requireUser, isAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const q = await prisma.question.findUnique({
    where: { id: params.id },
    include: { business: { select: { ownerId: true } } },
  });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (q.business.ownerId !== auth.user.id && !isAdmin(auth.user)) {
    return NextResponse.json({ error: "Only the owner can answer" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(answerSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = await prisma.question.update({
    where: { id: params.id },
    data: { answer: parsed.data.answer, answeredAt: new Date() },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(updated);
}
