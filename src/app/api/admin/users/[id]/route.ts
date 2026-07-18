import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isAdmin } from "@/lib/api-auth";

// Admin: deactivate or reactivate a user account.
// Deactivated users cannot sign in; their listings are also unpublished on deactivation.
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

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === auth.user.id) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Admin accounts cannot be deactivated via API" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { active: body.active },
    select: { id: true, active: true },
  });

  if (!body.active) {
    await prisma.business.updateMany({ where: { ownerId: params.id }, data: { active: false } });
  }

  return NextResponse.json(updated);
}
