import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionSchema, parseBody } from "@/lib/validation";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { requireUser, tooManyRequests } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const questions = await prisma.question.findMany({
    where: { businessId, business: { active: true } },
    include: { user: { select: { name: true } } },
    orderBy: [{ answer: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: 100,
  });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  const rl = rateLimit(`question:${userId}`, LIMITS.question.limit, LIMITS.question.windowMs);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(questionSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { businessId, question } = parsed.data;

  const business = await prisma.business.findFirst({ where: { id: businessId, active: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Owners cannot ask public questions on their own business
  if (business.ownerId === userId) {
    return NextResponse.json({ error: "You cannot ask a public question on your own business" }, { status: 403 });
  }

  const q = await prisma.question.create({
    data: { businessId, userId, question },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(q, { status: 201 });
}
