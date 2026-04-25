import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const type = searchParams.get("type"); // "DEAL" | "EVENT" | "UPDATE"
  const active = searchParams.get("active");
  const city = searchParams.get("city");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};
  if (businessId) where.businessId = businessId;
  if (type) where.type = type;
  if (active === "true") {
    where.active = true;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  }

  const posts = await prisma.businessPost.findMany({
    where: {
      ...where,
      business: city ? { city: { contains: city } } : undefined,
    },
    include: {
      business: {
        select: { name: true, slug: true, city: true, state: true, category: true, images: true, verified: true },
      },
      _count: { select: { rsvps: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  const data = await req.json();
  const { businessId, type, title, content, imageUrl, discountText, discountCode,
    originalPrice, salePrice, eventDate, eventEndDate, eventLocation,
    capacity, rsvpUrl, expiresAt, pinned } = data;

  if (!businessId || !type || !title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await prisma.businessPost.create({
    data: {
      businessId, type, title, content,
      imageUrl: imageUrl || null,
      discountText: discountText || null,
      discountCode: discountCode || null,
      originalPrice: originalPrice || null,
      salePrice: salePrice || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
      eventLocation: eventLocation || null,
      capacity: capacity ? parseInt(capacity) : null,
      rsvpUrl: rsvpUrl || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      pinned: pinned || false,
    },
    include: { business: { select: { name: true, slug: true, city: true, state: true } } },
  });

  return NextResponse.json(post, { status: 201 });
}
