import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema, parseBody } from "@/lib/validation";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { requireUser, tooManyRequests } from "@/lib/api-auth";
import { recalcBusinessRating } from "@/lib/reviews";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  const rl = rateLimit(`review:${userId}`, LIMITS.review.limit, LIMITS.review.windowMs);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(reviewSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { businessId, rating, title, comment } = parsed.data;

  const business = await prisma.business.findFirst({ where: { id: businessId, active: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Owners cannot review their own businesses
  if (business.ownerId === userId) {
    return NextResponse.json({ error: "You cannot review your own business" }, { status: 403 });
  }

  const existing = await prisma.review.findFirst({ where: { businessId, userId } });
  if (existing) {
    return NextResponse.json({ error: "You already reviewed this business" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: { businessId, userId, rating, title: title || null, comment },
    include: { user: { select: { name: true, image: true } } },
  });

  await recalcBusinessRating(businessId);

  return NextResponse.json(review, { status: 201 });
}
