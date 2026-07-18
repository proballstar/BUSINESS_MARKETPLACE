import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isAdmin } from "@/lib/api-auth";

// Admin: resolve or dismiss a report
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!isAdmin(auth.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.status || !["RESOLVED", "DISMISSED", "OPEN"].includes(body.status)) {
    return NextResponse.json({ error: "status must be RESOLVED, DISMISSED, or OPEN" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const updated = await prisma.report.update({
    where: { id: params.id },
    data: { status: body.status, resolvedAt: body.status === "OPEN" ? null : new Date() },
  });
  return NextResponse.json(updated);
}
