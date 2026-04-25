import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { businessId, rating, title, comment } = await req.json();

    if (!businessId || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const existing = await prisma.review.findFirst({ where: { businessId, userId } });
    if (existing) return NextResponse.json({ error: "You already reviewed this business" }, { status: 409 });

    const review = await prisma.review.create({
      data: { businessId, userId, rating, title: title || null, comment },
      include: { user: { select: { name: true, image: true } } },
    });

    // Recalculate average
    const { _avg, _count } = await prisma.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.business.update({
      where: { id: businessId },
      data: { rating: _avg.rating || 0, reviewCount: _count.rating },
    });

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
