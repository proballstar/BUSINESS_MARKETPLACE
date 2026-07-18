import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { businessSchema, parseBody } from "@/lib/validation";
import { getSessionUser, requireUser, isAdmin } from "@/lib/api-auth";

// Public for active listings; owner/admin can also fetch unpublished ones.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!business.active) {
    const user = await getSessionUser();
    if (!user || (business.ownerId !== user.id && !isAdmin(user))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  return NextResponse.json(business);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (business.ownerId !== auth.user.id && !isAdmin(auth.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(businessSchema.partial(), body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  const updated = await prisma.business.update({
    where: { id: params.id },
    data: {
      name: d.name ?? business.name,
      tagline: d.tagline !== undefined ? d.tagline || null : business.tagline,
      description: d.description ?? business.description,
      category: d.category ?? business.category,
      subcategory: d.subcategory !== undefined ? d.subcategory || null : business.subcategory,
      address: d.address ?? business.address,
      city: d.city ?? business.city,
      state: d.state ?? business.state,
      zip: d.zip ?? business.zip,
      phone: d.phone !== undefined ? d.phone || null : business.phone,
      email: d.email !== undefined ? d.email || null : business.email,
      website: d.website !== undefined ? d.website || null : business.website,
      images: d.images !== undefined ? JSON.stringify(d.images) : business.images,
      hoursJson: d.hoursJson !== undefined ? JSON.stringify(d.hoursJson) : business.hoursJson,
      socialLinks: d.socialLinks !== undefined ? JSON.stringify(d.socialLinks) : business.socialLinks,
      tags: d.tags !== undefined ? JSON.stringify(d.tags) : business.tags,
      teamJson: d.teamJson !== undefined ? JSON.stringify(d.teamJson) : business.teamJson,
      priceRange: d.priceRange !== undefined ? d.priceRange || null : business.priceRange,
      yearFounded: d.yearFounded !== undefined ? d.yearFounded ?? null : business.yearFounded,
      employeeCount: d.employeeCount !== undefined ? d.employeeCount || null : business.employeeCount,
      active: d.active !== undefined ? d.active : business.active,
    },
  });

  return NextResponse.json(updated);
}

// Unpublish (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (business.ownerId !== auth.user.id && !isAdmin(auth.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.business.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
