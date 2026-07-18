import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { answerSchema, parseBody } from "@/lib/validation";
import { requireUser, isAdmin } from "@/lib/api-auth";

// Owner: public reply to a customer review
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const review = await prisma.review.findUnique({
    where: { id: params.id },
    include: { business: { select: { ownerId: true } } },
  });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.business.ownerId !== auth.user.id && !isAdmin(auth.user)) {
    return NextResponse.json({ error: "Only the business owner can reply" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  // Accept either {reply} (existing UI) or {answer}
  const raw = body as { reply?: string; answer?: string };
  const parsed = parseBody(answerSchema, { answer: raw.answer ?? raw.reply });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = await prisma.review.update({
    where: { id: params.id },
    data: { ownerReply: parsed.data.answer },
  });
  return NextResponse.json(updated);
}
