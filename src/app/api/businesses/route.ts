import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { businessSchema, parseBody } from "@/lib/validation";
import { getSessionUser, requireUser, isAdmin } from "@/lib/api-auth";

// Public listing of active businesses; owner-scoped listing requires auth.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId");

  if (ownerId) {
    // Only the owner themself (or an admin) can list by ownerId — includes unpublished listings.
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.id !== ownerId && !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const businesses = await prisma.business.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(businesses);
  }

  const businesses = await prisma.business.findMany({
    where: { active: true },
    select: {
      id: true, name: true, slug: true, tagline: true, description: true,
      category: true, subcategory: true, tags: true, city: true, state: true,
      address: true, images: true, priceRange: true, rating: true,
      reviewCount: true, verified: true, featured: true, hoursJson: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(businesses);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(businessSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  const baseSlug = slugify(d.name);
  let slug = baseSlug;
  let count = 0;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++count}`;
  }

  await prisma.user.update({ where: { id: userId }, data: { role: "BUSINESS_OWNER" } });

  const business = await prisma.business.create({
    data: {
      name: d.name,
      slug,
      tagline: d.tagline || null,
      description: d.description,
      category: d.category,
      subcategory: d.subcategory || null,
      address: d.address,
      city: d.city,
      state: d.state,
      zip: d.zip || "",
      phone: d.phone || null,
      email: d.email || null,
      website: d.website || null,
      images: JSON.stringify(d.images),
      hoursJson: JSON.stringify(d.hoursJson),
      socialLinks: JSON.stringify(d.socialLinks),
      tags: JSON.stringify(d.tags),
      teamJson: JSON.stringify(d.teamJson),
      priceRange: d.priceRange || null,
      yearFounded: d.yearFounded ?? null,
      employeeCount: d.employeeCount || null,
      ownerId: userId,
    },
  });

  return NextResponse.json(business, { status: 201 });
}
