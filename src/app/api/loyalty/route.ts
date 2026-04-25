import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/loyalty?businessId=... — get customer's card or business config
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const configOnly = searchParams.get("config") === "true";
  const session = await getServerSession(authOptions);

  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const config = await prisma.loyaltyConfig.findUnique({ where: { businessId } });

  if (configOnly || !session?.user) return NextResponse.json({ config });

  const userId = (session.user as { id?: string }).id!;
  const card = await prisma.loyaltyCard.findUnique({ where: { businessId_userId: { businessId, userId } } });
  return NextResponse.json({ config, card });
}

// POST /api/loyalty — create or update loyalty config (owner)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  const { businessId, rewardName, stampsNeeded, description } = await req.json();
  if (!businessId || !rewardName || !stampsNeeded) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const config = await prisma.loyaltyConfig.upsert({
    where: { businessId },
    update: { rewardName, stampsNeeded: parseInt(stampsNeeded), description: description || null, active: true },
    create: { businessId, rewardName, stampsNeeded: parseInt(stampsNeeded), description: description || null },
  });
  return NextResponse.json(config);
}
