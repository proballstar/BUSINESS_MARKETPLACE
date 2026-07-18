import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportSchema, parseBody } from "@/lib/validation";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { requireUser, tooManyRequests } from "@/lib/api-auth";

// Signed-in users: report a review or business listing.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  const rl = rateLimit(`report:${userId}`, LIMITS.report.limit, LIMITS.report.windowMs);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(reportSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { targetType, targetId, reason, details } = parsed.data;

  // Verify the target exists
  const exists =
    targetType === "REVIEW"
      ? await prisma.review.findUnique({ where: { id: targetId }, select: { id: true } })
      : await prisma.business.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Reported content not found" }, { status: 404 });

  try {
    const report = await prisma.report.create({
      data: { targetType, targetId, reason, details: details || null, reporterId: userId },
    });
    return NextResponse.json({ id: report.id, status: report.status }, { status: 201 });
  } catch {
    // unique(reporterId, targetType, targetId)
    return NextResponse.json({ error: "You already reported this" }, { status: 409 });
  }
}
