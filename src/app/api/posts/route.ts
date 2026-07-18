import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema, parseBody } from "@/lib/validation";
import { requireUser, requireBusinessOwner } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const type = searchParams.get("type");
  const active = searchParams.get("active");
  const city = searchParams.get("city");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20") || 20, 50);

  const where: Record<string, unknown> = { business: { active: true, ...(city ? { city: { contains: city } } : {}) } };
  if (businessId) where.businessId = businessId;
  if (type && ["DEAL", "EVENT", "UPDATE"].includes(type)) where.type = type;
  if (active === "true") {
    where.active = true;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  }

  const posts = await prisma.businessPost.findMany({
    where,
    include: {
      business: {
        select: { name: true, slug: true, city: true, state: true, category: true, images: true, verified: true },
      },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(postSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  const ownership = await requireBusinessOwner(auth.user, d.businessId);
  if (ownership.response) return ownership.response;

  const post = await prisma.businessPost.create({
    data: {
      businessId: d.businessId,
      type: d.type,
      title: d.title,
      content: d.content,
      imageUrl: d.imageUrl || null,
      discountText: d.discountText || null,
      discountCode: d.discountCode || null,
      originalPrice: d.originalPrice || null,
      salePrice: d.salePrice || null,
      eventDate: d.eventDate ? new Date(d.eventDate) : null,
      eventEndDate: d.eventEndDate ? new Date(d.eventEndDate) : null,
      eventLocation: d.eventLocation || null,
      capacity: d.capacity ?? null,
      rsvpUrl: d.rsvpUrl || null,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      pinned: d.pinned || false,
    },
    include: { business: { select: { name: true, slug: true, city: true, state: true } } },
  });

  return NextResponse.json(post, { status: 201 });
}
