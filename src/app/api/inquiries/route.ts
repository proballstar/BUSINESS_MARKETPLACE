import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquirySchema, parseBody } from "@/lib/validation";
import { rateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { requireUser, requireBusinessOwner, tooManyRequests } from "@/lib/api-auth";

// Public: submit an inquiry to a business.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`inquiry:${ip}`, LIMITS.inquiry.limit, LIMITS.inquiry.windowMs);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseBody(inquirySchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { businessId, name, email, phone, subject, message } = parsed.data;

  const business = await prisma.business.findFirst({ where: { id: businessId, active: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Duplicate guard: same email + same business within 10 minutes
  const recent = await prisma.inquiry.findFirst({
    where: { businessId, email, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } },
  });
  if (recent) {
    return NextResponse.json(
      { error: "You recently sent a message to this business. Please wait before sending another." },
      { status: 429 }
    );
  }

  const inquiry = await prisma.inquiry.create({
    data: { businessId, name, email, phone: phone || null, subject: subject || null, message },
  });

  await prisma.business.update({
    where: { id: businessId },
    data: { inquiryCount: { increment: 1 } },
  });

  // Do not echo submitted contact details back publicly
  return NextResponse.json({ id: inquiry.id, status: inquiry.status }, { status: 201 });
}

// Private: business owner (or admin) lists inquiries for one of their businesses.
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const ownership = await requireBusinessOwner(auth.user, businessId);
  if (ownership.response) return ownership.response;

  const inquiries = await prisma.inquiry.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(inquiries);
}
