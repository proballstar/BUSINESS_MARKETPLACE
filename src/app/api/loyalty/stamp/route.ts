import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — customer enrolls in loyalty program (creates card with 1 stamp)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in to join loyalty program" }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  const { businessId } = await req.json();
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const config = await prisma.loyaltyConfig.findUnique({ where: { businessId, active: true } });
  if (!config) return NextResponse.json({ error: "Loyalty program not found" }, { status: 404 });

  const card = await prisma.loyaltyCard.upsert({
    where: { businessId_userId: { businessId, userId } },
    update: { stamps: { increment: 1 }, totalEarned: { increment: 1 } },
    create: { businessId, userId, stamps: 1, totalEarned: 1 },
  });

  // Auto-redeem when threshold reached
  let redeemed = false;
  if (card.stamps >= config.stampsNeeded) {
    await prisma.loyaltyCard.update({
      where: { businessId_userId: { businessId, userId } },
      data: { stamps: 0, rewardsClaimed: { increment: 1 } },
    });
    redeemed = true;
  }

  return NextResponse.json({ card, redeemed, config });
}
