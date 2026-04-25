import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: { owner: { select: { name: true, email: true } } },
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(business);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userRole = (session.user as { role?: string }).role;
  if (business.ownerId !== userId && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { name, description, category, address, city, state, zip, phone, email, website, images, hoursJson, socialLinks, tags, teamJson, priceRange, yearFounded, employeeCount, tagline, subcategory, active } = data;

    const updated = await prisma.business.update({
      where: { id: params.id },
      data: {
        name: name ?? business.name,
        tagline: tagline !== undefined ? tagline : business.tagline,
        description: description ?? business.description,
        category: category ?? business.category,
        subcategory: subcategory !== undefined ? subcategory : business.subcategory,
        address: address ?? business.address,
        city: city ?? business.city,
        state: state ?? business.state,
        zip: zip ?? business.zip,
        phone: phone !== undefined ? phone : business.phone,
        email: email !== undefined ? email : business.email,
        website: website !== undefined ? website : business.website,
        images: images !== undefined ? JSON.stringify(images) : business.images,
        hoursJson: hoursJson !== undefined ? JSON.stringify(hoursJson) : business.hoursJson,
        socialLinks: socialLinks !== undefined ? JSON.stringify(socialLinks) : business.socialLinks,
        tags: tags !== undefined ? JSON.stringify(tags) : business.tags,
        teamJson: teamJson !== undefined ? JSON.stringify(teamJson) : business.teamJson,
        priceRange: priceRange !== undefined ? priceRange : business.priceRange,
        yearFounded: yearFounded !== undefined ? (yearFounded ? parseInt(yearFounded) : null) : business.yearFounded,
        employeeCount: employeeCount !== undefined ? employeeCount : business.employeeCount,
        active: active !== undefined ? active : business.active,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userRole = (session.user as { role?: string }).role;
  if (business.ownerId !== userId && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.business.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
