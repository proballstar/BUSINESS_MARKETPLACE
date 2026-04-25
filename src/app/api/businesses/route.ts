import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId");

  const where: Record<string, unknown> = {};
  if (ownerId) where.ownerId = ownerId;
  else where.active = true;

  const businesses = await prisma.business.findMany({
    where,
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(businesses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const { name, description, category, address, city, state, zip, phone, email, website, images, hoursJson, socialLinks, tags, teamJson, priceRange, yearFounded, employeeCount, tagline, subcategory } = data;

    if (!name || !description || !category || !address || !city || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 0;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++count}`;
    }

    await prisma.user.update({ where: { id: userId }, data: { role: "BUSINESS_OWNER" } });

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        tagline: tagline || null,
        description,
        category,
        subcategory: subcategory || null,
        address,
        city,
        state,
        zip: zip || "",
        phone: phone || null,
        email: email || null,
        website: website || null,
        images: JSON.stringify(images || []),
        hoursJson: JSON.stringify(hoursJson || {}),
        socialLinks: JSON.stringify(socialLinks || {}),
        tags: JSON.stringify(tags || []),
        teamJson: JSON.stringify(teamJson || []),
        priceRange: priceRange || null,
        yearFounded: yearFounded ? parseInt(yearFounded) : null,
        employeeCount: employeeCount || null,
        ownerId: userId,
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }
}
