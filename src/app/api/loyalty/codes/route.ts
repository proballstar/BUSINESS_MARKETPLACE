import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBusinessOwner } from "@/lib/api-auth";

const CODE_TTL_MS = 15 * 60_000; // codes are valid for 15 minutes
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no confusable chars

function generateCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

// Owner: generate a one-time stamp code to hand to a customer at the counter.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  let body: { businessId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const ownership = await requireBusinessOwner(auth.user, body.businessId);
  if (ownership.response) return ownership.response;

  const config = await prisma.loyaltyConfig.findUnique({ where: { businessId: body.businessId } });
  if (!config || !config.active) {
    return NextResponse.json({ error: "Set up your loyalty program first" }, { status: 400 });
  }

  // Retry on the (unlikely) unique collision with an outstanding code
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    try {
      const stampCode = await prisma.stampCode.create({
        data: {
          businessId: body.businessId,
          code,
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      });
      return NextResponse.json(
        { code: stampCode.code, expiresAt: stampCode.expiresAt },
        { status: 201 }
      );
    } catch {
      // unique collision — clear expired codes and retry
      await prisma.stampCode.deleteMany({
        where: { businessId: body.businessId, expiresAt: { lt: new Date() }, redeemedAt: null },
      });
    }
  }
  return NextResponse.json({ error: "Could not generate code, try again" }, { status: 500 });
}
