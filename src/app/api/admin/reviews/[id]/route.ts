import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isAdmin } from "@/lib/api-auth";
import { recalcBusinessRating } from "@/lib/reviews";

// Admin: remove an abusive review
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!isAdmin(auth.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  await prisma.review.delete({ where: { id: params.id } });
  await recalcBusinessRating(review.businessId);
  return NextResponse.json({ success: true });
}
