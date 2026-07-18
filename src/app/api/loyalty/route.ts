import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loyaltyConfigSchema, parseBody } from "@/lib/validation";
import { getSessionUser, requireUser, requireBusinessOwner } from "@/lib/api-auth";

// GET /api/loyalty?businessId=... — public loyalty config; signed-in users also get their own card.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const config = await prisma.loyaltyConfig.findUnique({ where: { businessId } });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ config });

  const card = await prisma.loyaltyCard.findUnique({
    where: { businessId_userId: { businessId, userId: user.id } },
  });
  return NextResponse.json({ config, card });
}

// POST /api/loyalty — owner creates/updates their program
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(loyaltyConfigSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { businessId, rewardName, stampsNeeded, description } = parsed.data;

  const ownership = await requireBusinessOwner(auth.user, businessId);
  if (ownership.response) return ownership.response;

  const config = await prisma.loyaltyConfig.upsert({
    where: { businessId },
    update: { rewardName, stampsNeeded, description: description || null, active: true },
    create: { businessId, rewardName, stampsNeeded, description: description || null },
  });
  return NextResponse.json(config);
}
