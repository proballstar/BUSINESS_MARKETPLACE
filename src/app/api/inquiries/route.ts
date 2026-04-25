import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { businessId, name, email, phone, subject, message } = await req.json();

    if (!businessId || !name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId, active: true } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const inquiry = await prisma.inquiry.create({
      data: { businessId, name, email, phone: phone || null, subject: subject || null, message },
    });

    await prisma.business.update({
      where: { id: businessId },
      data: { inquiryCount: { increment: 1 } },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const inquiries = await prisma.inquiry.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(inquiries);
}
