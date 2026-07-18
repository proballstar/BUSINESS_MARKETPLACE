import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isAdmin } from "@/lib/api-auth";

// Admin: unpublish (deactivate) or republish a listing
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!isAdmin(auth.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active (boolean) required" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const updated = await prisma.business.update({
    where: { id: params.id },
    data: { active: body.active },
  });
  return NextResponse.json({ id: updated.id, active: updated.active });
}
