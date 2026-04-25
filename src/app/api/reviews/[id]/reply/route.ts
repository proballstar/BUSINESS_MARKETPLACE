import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;

  const review = await prisma.review.findUnique({
    where: { id: params.id },
    include: { business: { select: { ownerId: true } } },
  });

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.business.ownerId !== userId) {
    return NextResponse.json({ error: "Only the business owner can reply" }, { status: 403 });
  }

  const { reply } = await req.json();
  if (!reply?.trim()) return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 });

  const updated = await prisma.review.update({
    where: { id: params.id },
    data: { ownerReply: reply.trim() },
  });

  return NextResponse.json(updated);
}
