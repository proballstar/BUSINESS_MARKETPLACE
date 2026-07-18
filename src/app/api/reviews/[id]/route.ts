import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewUpdateSchema, parseBody } from "@/lib/validation";
import { requireUser, isAdmin } from "@/lib/api-auth";
import { recalcBusinessRating } from "@/lib/reviews";

// Author: edit own review
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.userId !== auth.user.id) {
    return NextResponse.json({ error: "You can only edit your own review" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(reviewUpdateSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = await prisma.review.update({
    where: { id: params.id },
    data: {
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      comment: parsed.data.comment,
    },
    include: { user: { select: { name: true, image: true } } },
  });

  await recalcBusinessRating(review.businessId);
  return NextResponse.json(updated);
}

// Author (or admin): delete review
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.userId !== auth.user.id && !isAdmin(auth.user)) {
    return NextResponse.json({ error: "You can only delete your own review" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: params.id } });
  await recalcBusinessRating(review.businessId);
  return NextResponse.json({ success: true });
}
